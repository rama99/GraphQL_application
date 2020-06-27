const {gql} = require('apollo-server-express');
const shortid = require('shortid');
const {authCheck} = require('../helpers/auth');
const User = require(`../models/user`);
const {DateTimeResolver} = require('graphql-scalars');

const me = async (parent , args , {req,res}) => {
    await authCheck(req);
    return `kishore`;
}

const userUpdate = async (parent , args , {req}) => {
    const currentUser = await authCheck(req);
    const updatedUser = await User.findOneAndUpdate({email:currentUser.email} , {...args.input},{
        new: true
    }).exec();

    return updatedUser;
}

const userCreate = async (parent , args , {req}) => {
    const currentUser = await authCheck(req);
    const user = await User.findOne({email:currentUser.email});
    return user ? user : new User({
        email: currentUser.email,
        username: shortid.generate()
    }).save();
}

const profile = async (parent,args,{req}) => {
    const currentUser = await authCheck(req);
    const user = await User.findOne({email:currentUser.email});
    return user;
}

const publicProfile = async (parent,args,{req}) => {
    return await User.findOne({username:args.username});    
}

const allUsers = async (parent,args,{req}) => {
    return await User.find({});
}

module.exports = {
    Query: {
        me,
        profile,
        publicProfile,
        allUsers
    },
    Mutation:{
        userCreate,
        userUpdate
    }
}