const { createPost, getPost, updatePost, deletePost, getAllPosts } = require('./app');

exports.handler = async (event, context) => {
  let response;

  try {
    switch (event.httpMethod) {
      case 'GET':
        if (event.path === '/posts') {
          response = await getAllPosts(event);
        } else if (event.pathParameters && event.pathParameters.postId) {
  
          response = await getPost(event);
        }
        break;

      case 'POST':
        if (event.path === '/posts') {
          response = await createPost(event);
        }
        break;

      case 'PUT':
        if (event.pathParameters && event.pathParameters.postId) {
          response = await updatePost(event);
        }
        break;

      case 'DELETE':
        if (event.pathParameters && event.pathParameters.postId) {
          response = await deletePost(event);
        }
        break;

      default:
        response = {
          statusCode: 404,
          body: JSON.stringify({ message: 'Not Found' }),
        };
    }
  } catch (err) {
    console.error(err);
    response = {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }

  return {
    ...response,
    headers: {
      'Content-Type': 'application/json',
    },
  };
};