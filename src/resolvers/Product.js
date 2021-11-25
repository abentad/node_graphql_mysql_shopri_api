const jsonParser = require('../utils/jsonParser');

const Product = {
    async poster(parent, args, { dbQuery }, info){
        const user = await dbQuery(`SELECT * FROM users WHERE id = ${parent.posterId}`);
        return jsonParser(user)[0];
    }
};

module.exports = Product;