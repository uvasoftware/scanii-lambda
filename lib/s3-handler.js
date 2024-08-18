const AWS = require('aws-sdk');
const assert = require('assert');
const qs = require('querystring');
const CONFIG = require('./config').CONFIG;
const utils = require('./utils');
const scanii = require('./client');
const pkg = require('../package.json');


/**
 * Handles events from S3 and submits object for processing
 * @param event {Object} S3 event to be processed
 * @param context the AWS lambda context
 * @param callback AWS lambda callback
 */
exports.handler = async (event, context, callback) => {

  try {
    console.log(`handling s3 event using ${pkg.name}/v${pkg.version}`);

    // pre-flight checks:
    assert.ok(CONFIG.CALLBACK_URL !== null, "api callback url cannot be null");
    assert.ok(CONFIG.KEY !== null, "api key cannot be null");
    assert.ok(CONFIG.SECRET !== null, "api secret cannot be null");

    const scaniiClient = new scanii.ScaniiClient(CONFIG.KEY, CONFIG.SECRET, CONFIG.API_ENDPOINT,
      CONFIG.MAX_ATTEMPTS, CONFIG.MAX_ATTEMPT_DELAY_MSEC);

    const S3 = new AWS.S3({apiVersion: '2006-03-01'});

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;

    // see https://forums.aws.amazon.com/thread.jspa?threadID=215813
    const key = Object.keys(qs.decode(event.Records[0].s3.object.key))[0];

    // sanity checks
    assert(bucket !== undefined, "bucket not present in s3 event");
    assert(key !== undefined, "key not present in s3 event");
    assert(key.endsWith('/') !== true, "cannot process directory");

    console.log('processing ' + utils.internalId(bucket, key));

    // creating signed url for processing - permissions are only checked at execution time
    // https://forums.aws.amazon.com/thread.jspa?threadID=252897
    const url = S3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: CONFIG.SIGNED_URL_DURATION
    });
    console.log('created signed url', url);

    console.log('submitting content for processing');
    // signing request
    const signature = utils.generateSignature(bucket, key);
    console.log('using signature ' + signature);

    const metadata = {
      "signature": signature,
      "bucket": bucket,
      "key": key
    };

    const submitResult = await scaniiClient.fetch(url, CONFIG.CALLBACK_URL, metadata);
    assert.ok(submitResult.id !== undefined, "invalid response from server");
    assert.ok(submitResult.location !== undefined, "invalid response from server, no response received");
    console.log(`contents submitted for processing with id: ${submitResult.id} and location: ${submitResult.location}`);


    // returning back to
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
