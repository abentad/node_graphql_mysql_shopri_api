const Product = {
    async poster(parent, args, { prisma }, info){
        const user = await prisma.users.findUnique({ where:{ id: Number(parent.posterId) } });
        return user;
    }
};

module.exports = Product;