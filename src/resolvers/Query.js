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
        const product = await dbQuery.products.findUnique({ where:{ id: Number(id) } });
        if(!product) throw new Error('Product not found');
        return product;
    },
    async products(parent, { page, take}, { dbQuery }, info){
        //TODO: Sort it
        const products = await dbQuery.products.findMany({ skip: page * take, take });
        return products;
    },
}

module.exports = Query;