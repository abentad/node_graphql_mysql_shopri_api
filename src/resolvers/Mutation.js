const { createWriteStream, unlink } = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const getUserId = require('../utils/getUserId');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const handleUserUpdate = require('../utils/handleUserUpdate');
const handleProductUpdate = require('../utils/handleProductUpdate');


const jwtSecret = 'somesecret';

const Mutation = {
    async createUser(parent, { data }, { dbQuery }, info){
        if(data.password.length < 8) throw new Error('Password length must be at least 8');
        data.password = await hashPassword(data.password);
        const insertData = await dbQuery( `INSERT INTO users (deviceToken, username, email, phoneNumber, password, profile_image, dateJoined)\
        VALUES ('${data.deviceToken}', '${data.username}', '${data.email}', '${data.phoneNumber}', '${data.password}', '${data.profile_image}', '${data.dateJoined}')`);
        if(insertData['insertId'] === 0) throw new Error('Failed Signing up user');
        const userId = insertData['insertId'];
        const [user] = await dbQuery(`SELECT * FROM users WHERE id = ${userId}`);
        const token = jwt.sign({ id: user.id }, jwtSecret);
        return { user, token };    
    },
    async loginUser(parent, { data }, { dbQuery }, info){
        const [user] = await dbQuery(`SELECT * FROM users WHERE email = ?`, [data.email]);
        if(!user) throw new Error('Email doesn\'t exist');
        const isMatch = await comparePassword(data.password, user.password);
        if(!isMatch) throw new Error('Incorrect password');
        const token = jwt.sign({ id: user.id }, jwtSecret);
        return { user, token };
    },
    async loginUserByToken(parent, args, { dbQuery, req }, info){
        const userId = getUserId(req);
        const [user] = await dbQuery(`SELECT * FROM users WHERE id = ${userId}`);
        if(!user) throw new Error('User not found');
        return user;
    },
    async updateUser(parent, { data }, { dbQuery, req }, info){
        const userId = getUserId(req);
        const [originalUser] = await dbQuery(`SELECT * FROM users WHERE id = ${userId}`);
        if(!originalUser) throw new Error('User not found');
        if(data.password) data.password = await hashPassword(data.password);
        const d = handleUserUpdate(data, originalUser);
        const updateData = await dbQuery(`UPDATE users SET deviceToken = '${d.deviceToken}', username = '${d.username}', email = '${d.email}',\
        phoneNumber = '${d.phoneNumber}', password = '${d.password}', profile_image = '${d.profile_image}', dateJoined = '${d.dateJoined}' WHERE id = ?`,[userId]);
        if(updateData['changedRows'] === 0) throw new Error('Failed updating User');
        const [updatedUser] = await dbQuery(`SELECT * FROM users WHERE id = ${userId}`);
        return updatedUser;
    },
    async deleteUser(parent, args, { dbQuery, req }, info){
        const userId = getUserId(req);
        const [user] = await dbQuery(`SELECT * FROM users WHERE id = ${userId}`);
        if(!user) throw new Error('User not found');
        const deleteData = await dbQuery(`DELETE FROM users WHERE id = ${userId}`);
        if(deleteData['affectedRows'] === 0) throw new Error('Failed removing user');
        return user;
    },
    //For admin use only need to add authorization
    async deleteUserById(parent, args, { dbQuery, req }, info){
        const [user] = await dbQuery(`SELECT * FROM users WHERE id = ${args.id}`);
        if(!user) throw new Error('User not found');
        const deleteData = await dbQuery(`DELETE FROM users WHERE id = ${args.id}`);
        if(deleteData['affectedRows'] === 0) throw new Error('Failed removing user');
        return user;
    },
    async createProduct(parent, { data }, { dbQuery, req }, info){
        const userId = getUserId(req);
        const insertData = await dbQuery( `INSERT INTO products (isPending, views, name, price, description, category, image, datePosted, posterId)\
        VALUES ('${data.isPending}', '${data.views}', '${data.name}', '${data.price}', '${data.description}', '${data.category}', '${data.image}', '${data.datePosted}', '${userId}')`);
        if(insertData['insertId'] === 0) throw new Error('Failed adding product');
        const productId = insertData['insertId'];
        const [product] = await dbQuery(`SELECT * FROM products WHERE id = ${productId}`);
        return product;
    },
    async updateProduct(parent, { data }, { dbQuery, req }, info){
        const userId = getUserId(req);
        const [originalProduct] = await dbQuery(`SELECT * FROM products WHERE id = ${data.id}`);
        if(!originalProduct) throw new Error('Product not found');
        if(originalProduct.posterId !== userId) throw new Error('User not authorized to update product');
        const d = handleProductUpdate(data, originalProduct);
        const updateData = await dbQuery(`UPDATE products SET isPending = '${d.isPending}', views = '${d.views}', name = '${d.name}',\
        price = '${d.price}', description = '${d.description}', category = '${d.category}', image = '${d.image}', datePosted = '${d.datePosted}' WHERE id = ?`,[data.id]);
        if(updateData['changedRows'] === 0) throw new Error('Failed updating Product');
        const [updatedProduct] = await dbQuery(`SELECT * FROM products WHERE id = ${data.id}`);
        return updatedProduct;
    },
    async deleteProduct(parent, args, { dbQuery, req}, info){
        const userId = getUserId(req);
        const [product] = await dbQuery(`SELECT * FROM products WHERE id = ${args.id}`);
        if(!product) throw new Error('Product not found');
        if(product.posterId !== userId) throw new Error('User not authorized to delete post');
        const deleteData = await dbQuery(`DELETE FROM products WHERE id = ${args.id}`);
        if(deleteData['affectedRows'] === 0) throw new Error('Failed removing user');
        return product;
    },
    singleUpload: async (parent, { file }) => {
        const { createReadStream, filename, mimetype, encoding } = await file;  
        const stream = createReadStream();
        const filelocation = path.join(__dirname, `/../images/${filename}`);
        await new Promise((resolve, reject) => {
            const writeStream = createWriteStream(filelocation);
            writeStream.on('finish', resolve);
            writeStream.on('error', (error) => {
              unlink(filelocation, () => {
                reject(error);
              });
            });
            stream.on('error', (error) => writeStream.destroy(error));
            stream.pipe(writeStream);
        });  
        return { filename, mimetype, encoding, filelocation };
    },
};

module.exports = Mutation;
