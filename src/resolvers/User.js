const User = {
    async products(parent, args, { prisma }, info){
        const products = await prisma.products.findMany({ where: { posterId: String(parent.id) } });
        return products;
    }
};

module.exports = User;