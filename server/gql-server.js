const { ApolloServer} = require('apollo-server');

require('dotenv').config();

const typeDefs = `

    type Query {
        totalPosts: Int!
    }

`;


const resolvers = {
    Query: {
        totalPosts: () => {
            return 42;
        }
    }
}

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
});

apolloServer.listen(process.env.PORT , () => {
    console.log(`gql server on port 8000`);
})