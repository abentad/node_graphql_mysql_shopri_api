const User = {
    async products(parent, args, { dbQuery }, info){
        const products = await dbQuery(`SELECT * FROM products WHERE posterId = ${parent.id}`);
        return products;
    }
};

module.exports = User;