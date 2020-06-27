const express = require("express");
const { ApolloServer , PubSub } = require('apollo-server-express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const {fileLoader , mergeTypes , mergeResolvers} = require('merge-graphql-schemas');
require("dotenv").config();
const {authCheck, authCheckMiddleware} = require("./helpers/auth");
const cors = require("cors");
const bodyParser = require("body-parser");
const cloudinary = require("cloudinary");

const pubsub = new PubSub();

const app = express();

const db = async () => {

    try {
       const success = await mongoose.connect(process.env.DATABASE , {
           useNewUrlParser: true,
           useUnifiedTopology: true,
           useCreateIndex: true,
           useFindAndModify: false
       });

       console.log(`DB connected`);
    }
    catch(err) {
        console.log(err);
    }
}

db();

app.use(cors());
app.use(bodyParser.json({limit: '5mb'}));

const typeDefs = mergeTypes(fileLoader(path.join(__dirname,`./typeDefs`)));

const resolvers = mergeResolvers(fileLoader(path.join(__dirname,`./resolvers`)));


const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req,res}) => ({req,res,pubsub})
});

apolloServer.applyMiddleware({
    app
});

const httpserver = http.createServer(app);
apolloServer.installSubscriptionHandlers(httpserver);

app.get(`/rest` , authCheck, (req , res) => {
    res.json({
        data: `you hit rest endpoint`
    })
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


app.post(`/uploadimages` , authCheckMiddleware , (req  , res) => {

    cloudinary.uploader.upload(req.body.image , result => {
       console.log(result);
       res.send({ url: result.secure_url,
                  public_id: result.public_id
       });

    },{
        public_id: `${Date.now()}`,
        resource_type: 'auto'
    })
} )

app.post(`/removeimage` ,authCheckMiddleware ,  (req , res) => {

    let image_id = req.body.public_id;
    cloudinary.uploader.destroy(image_id,(err , result) => {
        if(err) return res.json({success: false,err});
        res.send(`ok`);
    })
})

//app
httpserver.listen(process.env.PORT , () => {
    console.log(`Server is ready at http://localhost:${process.env.PORT}`);
    console.log(`graphql Server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`);
    console.log(`subscription is ready at http://localhost:${process.env.PORT}${apolloServer.subscriptionsPath}`);
})