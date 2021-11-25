const { createWriteStream, unlink } = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const getUserId = require('../utils/getUserId');
const { hashPassword, comparePassword } = require('../utils/hashPassword');

const jwtSecret = 'somesecret';

const Mutation = {
    async createUser(parent, { data }, { prisma }, info){
        if(data.password.length < 8) throw new Error('Password length must be at least 8');
        data.password = await hashPassword(data.password);
        const user = await prisma.users.create({ data });
        const token = jwt.sign({ id: user.id }, jwtSecret);
        return { user, token };
    },
    async loginUser(parent, { data }, { prisma }, info){
        const user = await prisma.users.findUnique({ where:{ email: data.email } });
        if(!user) throw new Error('Email doesn\'t exist');
        const isMatch = await comparePassword(data.password, user.password);
        if(!isMatch) throw new Error('Incorrect password');
        const token = jwt.sign({ id: user.id }, jwtSecret);
        return { user, token };
    },
    async loginUserByToken(parent, args, { prisma, req }, info){
        const userId = getUserId(req);
        const user = await prisma.users.findUnique({ where: { id: Number(userId) } });
        if(!user) throw new Error('User not found');
        return user;
    },
    async updateUser(parent, { data }, { prisma, req }, info){
        const userId = getUserId(req);
        const user = await prisma.users.findUnique({ where: { id: Number(userId) } });
        if(!user) throw new Error('User not found');
        if(data.password) data.password = await hashPassword(data.password);
        const updatedUser = await prisma.users.update({ where: { id: Number(userId) }, data });
        return updatedUser;
    },
    async deleteUser(parent, args, { prisma, req }, info){
        const userId = getUserId(req);
        const deletedUser = await prisma.users.delete({ where: { id: Number(userId) } });
        if(!deletedUser) throw new Error('User not found');
        return deletedUser;
    },
    //TODO: For admin use only need to add authorization
    async deleteUserById(parent, args, { prisma, req }, info){
        const deletedUser = await prisma.users.delete({ where: { id: Number(args.id) } });
        if(!deletedUser) throw new Error('User not found');
        return deletedUser;
    },
    async createProduct(parent, { data }, { prisma, req }, info){
        const userId = getUserId(req);
        const product = await prisma.products.create({ data: {...data, posterId: userId} });
        return product;
    },
    async updateProduct(parent, { data }, { prisma, req }, info){
        const userId = getUserId(req);
        const product = await prisma.products.findUnique({ where: { id: Number(data.id) } });
        if(!product) throw new Error('Product not found');
        if(product.posterId !== userId) throw new Error('User not authorized to update post');
        //this line is for removing the id from the data object so we can pass it to data when updating 
        let {id, ...newData} = data;
        const updatedProduct = await prisma.products.update({ where: { id: Number(data.id) }, data: newData });
        return updatedProduct;
    },
    async deleteProduct(parent, args, { prisma, req}, info){
        const userId = getUserId(req);
        const product = await prisma.products.findUnique({ where: { id: Number(args.id) } });
        if(!product) throw new Error('Product not found');
        if(product.posterId !== userId) throw new Error('User not authorized to delete post');
        const deletedProduct = await prisma.products.delete({ where: { id: Number(args.id) } });
        return deletedProduct;
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
