const {gql} = require('apollo-server-express');
const {posts} = require('../temp');
const {authCheck} = require('../helpers/auth');
const {DateTimeResolver} = require('graphql-scalars');
const User = require('../models/user');
const Post = require('../models/post');

// subscriptions
const POST_ADDED = 'POST_ADDED';


const postCreate = async (parent, args, { req , pubsub }) => {
    const currentUser = await authCheck(req);
    // validation
    if (args.input.content.trim() === '') throw new Error('Content is required');

    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    });
    let newPost = await new Post({
        ...args.input,
        postedBy: currentUserFromDb._id
    })
        .save()
        .then((post) => post.populate('postedBy', '_id username').execPopulate());

    pubsub.publish(POST_ADDED,{postAdded: newPost});

    return newPost;
}; 

const allPosts = async (parent , args , {req}) => {   

    const currentPage = args.page || 1;
    const perPage = 1;

    return await Post.find({})
                    .skip((currentPage - 1) * perPage)
                    .populate('postedBy', '_id username')
                    .limit(perPage)
                    .sort({createdAt: -1});
}

const postsByUser = async(parent , args , {req}) => {

    const currentUser = await authCheck(req);

    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    });

    return await Post.find({postedBy: currentUserFromDb._id})
                .populate('postedBy', '_id username')               
                .sort({createdAt: -1});
}

const singlePost = async (parent , args , {req}) => {
    return Post.findById(args.postId)
            .populate('postedBy', '_id username');
}

const postUpdate = async (parent, args , {req}) => {

    const currentUser = await authCheck(req);

    if(args.input.content.trim() === ``) throw new Error(`Content is required`);

    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    });

    const postToUpdate = await Post.findById(args.input._id);

    if(currentUserFromDb._id.toString() !== postToUpdate.postedBy._id.toString()) {
        throw new Error(`Unauthorized Action`);
    }

    let updatedPost = await Post.findByIdAndUpdate(args.input._id,{...args.input},{new: true})
                                .exec()
                                .then((post) => post.populate('postedBy', '_id username').execPopulate());


    return updatedPost;

}

const postDelete = async (parent , args , {req}) => {
    const currentUser = await authCheck(req);

    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    });

    const postToDelete = await Post.findById(args.postId);

    if(currentUserFromDb._id.toString() !== postToDelete.postedBy._id.toString()) {
        throw new Error(`Unauthorized Action`);
    }

    let deletedPost = await Post.findByIdAndDelete(args.postId);

    return deletedPost;

}

const totalPosts = async (parent , args , {req}) => {

   return await Post.find({}).estimatedDocumentCount();
}

const search = async (parent, { query }) => {
    return await Post.find({ $text: { $search: query } })
        .populate('postedBy', 'username')
        .exec();
};

module.exports = {
    Query: {
        allPosts,
        postsByUser,
        singlePost,
        totalPosts,
        search  
    },
    Mutation: {
        postCreate,
        postUpdate,
        postDelete
    },
    Subscription: {
        postAdded: {
            subscribe: (parent , args , {pubsub}) => pubsub.asyncIterator([POST_ADDED])
        }
    }
}