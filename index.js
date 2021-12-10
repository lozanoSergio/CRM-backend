const { ApolloServer } = require('apollo-server');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');

const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

require('dotenv').config();

connectDB();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        const token = req.headers['authorization'];
        if (token) {
            try {
                const verifiedUser = jwt.verify(
                    token,
                    process.env.TOKEN_SECRET
                );

                return { verifiedUser };
            } catch (error) {
                console.error(error);
            }
        }
    },
});

server.listen().then(({ url }) => {
    console.log(`Server running ${url}`);
});
