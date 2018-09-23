const handlers = require('./handlers');
const CONFIG = require('./config').CONFIG;

/**
 * lambda entry point function
 * @param event event to be processed
 * @param context lambda environmental context object
 * @param callback the lambda flow control callback
 */
exports.handler = async (event, context, callback) => {

  console.log("starting");
  console.log(`handler using key [${CONFIG.KEY}]`);
  console.log(`callback URL:  [${CONFIG.CALLBACK_URL}]`);


  try {
    if (event.Records !== undefined) {
      await handlers.handleS3Event(event);
    } else {
      await handlers.handleApiGatewayEvent(event);
    }

    callback(null, {
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({status: "OK"}, null, 2)
    });

  } catch (error) {
    console.error(error, error.stack); // an error occurred
    callback(null, {
      "statusCode": 500,
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({status: error.message}, null, 2)
    });
  }
};
