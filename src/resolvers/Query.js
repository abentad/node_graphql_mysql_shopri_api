const Query = {
    async user(parent, { id }, { dbQuery }, info){
        let user = await dbQuery(`SELECT * FROM users WHERE id = ${id}`);
        if(!user[0]) throw new Error('User not found');
        return user[0];
    },
    async users(parent, args, { dbQuery }, info){
        const users = await dbQuery('SELECT * FROM users');
        return users;
    },
    async product(parent, { id }, { dbQuery }, info){
        let product = await dbQuery(`SELECT * FROM products WHERE id = ${id}`);
        if(!product[0]) throw new Error('Product not found');
        return product[0];
    },
    async products(parent, { page, take}, { dbQuery }, info){
        //TODO: Paginate
        const products = await dbQuery('SELECT * FROM products');
        return products;
    },
}

module.exports = Query;