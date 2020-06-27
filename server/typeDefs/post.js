const {gql} = require('apollo-server-express');

module.exports = gql`   
    
    type Post {
        _id: ID!
        content: String
        image: Image
        postedBy: User        
    }  

    input PostCreateInput {      
        content: String!
        image: ImageInput
    }

    input PostUpdateInput {     
        _id: String! 
        content: String!
        image: ImageInput
    }

    # Queries
    type Query {      
        totalPosts: Int!
        allPosts(page: Int): [Post!]!
        postsByUser: [Post!]!
        singlePost(postId: String!):Post!
        search(query: String): [Post]
    }

    # Mutations
    type Mutation {
       postCreate(input: PostCreateInput!):Post!
       postUpdate(input: PostUpdateInput!):Post!
       postDelete(postId: String!):Post!
    }

    # Subscriptions
    type Subscription {
        postAdded: Post
    }

`;