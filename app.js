const db = require("./config/aws");
const {
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ScanCommand
}= require("@aws-sdk/client-dynamodb");
const {marshall, unmarshall} = require("@aws-sdk/util-dynamodb");

const getPost = async (event) =>{
    const reponse = {statusCode: 200};

    try {
        const params ={
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({postId: event.pathParameters.postId})
        }
        const {Item} = await db.send(new GetItemCommand(params));
        console.log({Item});
        reponse.body = JSON.stringify({
            message: "Successfully retrieved post.",
            data: (Item) ? unmarshall(Item) : {},
            rawData: Item,
        });
        
        // if (!Item) {
        //     reponse.statusCode = 404;
        //     reponse.body = JSON.stringify({message: "Post not found"});
        //     }
    } catch (error) {
        console.error(error);
        reponse.statusCode = 500;
        reponse.body = JSON.stringify({message: "Failed to get post",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return reponse;
}
const createPost = async (event) =>{
    const reponse = {statusCode: 201};

    try {
        const body = JSON.parse(event.body);
        const params ={
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(body || {})
        }
        const createResult = await db.send(new PutItemCommand(params));
        reponse.body = JSON.stringify({
            message: "Successfully created post.",
            createResult,
        });
    } catch (error) {
        console.error(error);
        reponse.statusCode = 500;
        reponse.body = JSON.stringify({message: "Failed to create post",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return reponse;
}
const updatePost = async (event) =>{
    const reponse = {statusCode: 201};

    try {
        const body = JSON.parse(event.body);
        const objKeys = Object.keys(body);
        const params ={
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({postId: event.pathParameters.postId}),
            /*
            "UpdateExpression" : "SET #attrName =:attrValue",
            "ExpressionAttributeNames": {
            "#attrName": "SessionID"
            },
            "ExpressionAttributeValues": {
            ":attrValue": {
            "S": "some string"
            },
            },

            */
           UpdateExpression: `SET ${objKeys.map((key, index)=> `#key${index} = :value${index}`).join(", ")}`,
           ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({...acc,
            [`#key${index}`]: key,
            }),{}),
            ExpressionAttributeValues: objKeys.reduce((acc, key, index) => ({...acc,
                [`:value${index}`]: body[key],
                }),{}),
        }
        const updateResult = await db.send(new UpdateItemCommand(params));
        reponse.body = JSON.stringify({
            message: "Successfully updated post.",
            updateResult,
        });
    } catch (error) {
        console.error(error);
        reponse.statusCode = 500;
        reponse.body = JSON.stringify({message: "Failed to update post",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return reponse;
}
const deletePost = async (event) =>{
    const reponse = {statusCode: 201};

    try {
        const params ={
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({postId: event.pathParameters.postId}),
        }
        const deleteResult = await db.send(new DeleteItemCommand(params));
        reponse.body = JSON.stringify({
            message: "Successfully deleted post.",
            deleteResult,
        });
    } catch (error) {
        console.error(error);
        reponse.statusCode = 500;
        reponse.body = JSON.stringify({message: "Failed to delete post",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return reponse;
}
const getAllPosts = async (event) =>{
    const reponse = {statusCode: 200};

    try {
        const {Items} = await db.send(new ScanCommand({TableName: process.env.DYNAMODB_TABLE_NAME}))
        response.body = JSON.stringify({
            message: "Successfully retrieved all posts.",
            data: Items.map((item)=>unmarshall(item)),
            Items
        })
    } catch (error) {
        console.error(error);
        reponse.statusCode = 500;
        reponse.body = JSON.stringify({message: "Failed to retrived posts",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return reponse;
}

module.exports={
    createPost,
    getPost,
    updatePost,
    deletePost,
    getAllPosts,
}