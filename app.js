const db = require("./config/aws");
const {
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ScanCommand
}= require("@aws-sdk/client-dynamodb");
const {marshall, unmarshall} = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require("uuid");

const getPost = async (event) => {
    const response = { statusCode: 200 };
    if (!event.pathParameters || !event.pathParameters.postId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing postId in path parameters" }),
        };
      }
  
    try {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: marshall({ postId: event.pathParameters.postId }),
      };
      const { Item } = await db.send(new GetItemCommand(params));
      console.log({ Item });
      response.body = JSON.stringify({
        message: "Successfully retrieved post.",
        data: Item ? unmarshall(Item) : {},
        rawData: Item,
      });
    } catch (error) {
      console.error(error);
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "Failed to get post",
        errorMsg: error.message,
        errorStack: error.stack,
      });
    }
    return response; 
  };


const createPost = async (event) => {
    const response = { statusCode: 201 };
  
    try {
      console.log("Event Body:", event.body);
      let body;
      
        body = JSON.parse(event.body);

      const rating = body.rating;
      if (rating === undefined || rating < 1 || rating > 5) {
        throw new Error("Rating must be a number between 1 and 5.");
      }
  
      const predefinedAnswers = body.predefinedAnswers || [];
      if (!Array.isArray(predefinedAnswers)) {
        throw new Error("predefinedAnswers must be an array");
      }
  
      predefinedAnswers.forEach((question, index) => {
        if (!question.questionId || !question.question || !question.options) {
          throw new Error(`Invalid structure for question at index ${index}`);
        }
      });

      const id = uuidv4();
      const timestamp = new Date().toISOString();

      const item = {
        postId: id,
        predefinedAnswers,
        customReason: body.customReason || "",
        rating: body.rating,
        createdAt: timestamp,
      };
  
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(item),
      };

      const createResult = await db.send(new PutItemCommand(params));

      response.body = JSON.stringify({
        message: "Successfully added feedback.",
        data: item,
        createResult,
      });
    } catch (error) {
      console.error(error);
      response.statusCode = 500;
      response.body = JSON.stringify({
        message: "Failed to add feedback.",
        errorMsg: error.message,
        errorStack: error.stack,
      });
    }
  
    return response;
  };
  

const updatePost = async (event) => {
  const response = { statusCode: 200 };

  try {
    console.log("Event Body:", event.body);

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid JSON in request body" }),
      };
    }

    console.log("Parsed Body:", body);

    if (!event.pathParameters || !event.pathParameters.postId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing postId in path parameters" }),
      };
    }
    if (!body || Object.keys(body).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is empty" }),
      };
    }

    const objKeys = Object.keys(body).filter((key) => body[key] !== undefined); 
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: event.pathParameters.postId }),
      UpdateExpression: `SET ${objKeys.map((key, index) => `#key${index} = :value${index}`).join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
        ...acc,
        [`#key${index}`]: key,
      }), {}),
      ExpressionAttributeValues: objKeys.reduce((acc, key, index) => ({
        ...acc,
        [`:value${index}`]: body[key],
      }), {}),
    };

    console.log("DynamoDB Params:", params);

    const updateResult = await db.send(new UpdateItemCommand(params));

    response.body = JSON.stringify({
      message: "Successfully updated post.",
      data: body,
      updateResult,
    });
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to update post",
      errorMsg: error.message,
      errorStack: error.stack,
    });
  }

  return response;
};

const deletePost = async (event) =>{
    const response = {statusCode: 201};
    if (!event.pathParameters || !event.pathParameters.postId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing postId in path parameters" }),
        };
      }

    try {
        const params ={
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({postId: event.pathParameters.postId}),
        }
        const deleteResult = await db.send(new DeleteItemCommand(params));
        response.body = JSON.stringify({
            message: "Successfully deleted post.",
            deleteResult,
        });
    } catch (error) {
        console.error(error);
        response.statusCode = 500;
        response.body = JSON.stringify({message: "Failed to delete post",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return response;
}
const getAllPosts = async (event) =>{
    const response = {statusCode: 200};

    try {
        const {Items} = await db.send(new ScanCommand({TableName: process.env.DYNAMODB_TABLE_NAME}))
        response.body = JSON.stringify({
            message: "Successfully retrieved all posts.",
            data: Items.map((item)=>unmarshall(item)),
            Items
        })
    } catch (error) {
        console.error(error);
        response.statusCode = 500;
        response.body = JSON.stringify({message: "Failed to retrived posts",
            errorMsg: error.message,
            errorStack: error.stack
        });
    }
    return response;
}

module.exports={
    createPost,
    getPost,
    updatePost,
    deletePost,
    getAllPosts,
}