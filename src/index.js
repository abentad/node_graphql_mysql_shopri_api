const { GraphQLServer } = require('graphql-yoga');
const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const User = require('./resolvers/User');
const Product = require('./resolvers/Product');
const Upload = require('./resolvers/Upload');
const { dbQuery } = require('./utils/database');


const server = new GraphQLServer({ 
    typeDefs:'src/schema.graphql',
    resolvers: { Upload, Query, Mutation, User, Product },
    context(req){
        return { req, dbQuery };
    } 
});

// server.express.use();


server.start(() => console.log('Server is running on http://localhost:4000'));


