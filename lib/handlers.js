const AWS = require('aws-sdk');
const assert = require('assert');
const qs = require('querystring');
const CONFIG = require('./config').CONFIG;
const actions = require('./actions');
const utils = require('./utils');
const scanii = require('./client');


/**
 * Handles HTTP result callback
 * @param {Object} event the API gateway event to be processed
 */
const handleApiGatewayEvent = async (event) => {
  console.log('handling callback event');

  let r = event;
  if (event.body !== undefined) {
    // if this is proxy request we yank the actual body from the payload
    r = JSON.parse(event.body);
  }
  console.log("metadata:", r.metadata);

  // callback sanity checks
  assert.ok(r.id !== undefined, "no id provided");
  assert.ok(r.metadata !== undefined, "no metadata supplied");
  assert.ok(r.metadata.bucket !== undefined, "no bucket supplied in metadata");
  assert.ok(r.metadata.key !== undefined, "no key supplied in metadata");
  assert.ok(r.metadata.signature !== undefined, "no signature supplied in metadata");

  // now asserting bucket/keys were not tampered with:
  assert.ok(r.metadata.signature === utils.generateSignature(r.metadata.bucket, r.metadata.key), "invalid signature");
  console.log('signature check passed for signature', r.metadata.signature);

  return await actions.onFindings(r.metadata.bucket, r.metadata.key, r);
};

/**
 * Handles events from S3 and submits object for processing
 * @param event {Object} S3 event to be processed
 */
const handleS3Event = async (event) => {

  const S3 = new AWS.S3({apiVersion: '2006-03-01'});

  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;

  // see https://forums.aws.amazon.com/thread.jspa?threadID=215813
  const key = Object.keys(qs.decode(event.Records[0].s3.object.key))[0];

  // sanity checks
  assert(bucket !== undefined, "bucket not present in s3 event");
  assert(key !== undefined, "key not present in s3 event");

  console.log('processing ' + utils.internalId(bucket, key));

  // creating signed url for processing
  const url = S3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: 3600 // 1 hour in seconds
  });
  console.log('created signed url', url);

  console.log('submitting content for processing');
  // signing request
  const signature = utils.generateSignature(bucket, key);
  console.log('using signature ' + signature);

  const metadata = {
    "metadata[signature]": signature,
    "metadata[bucket]": bucket,
    "metadata[key]": key
  };

  let result = await scaniiClient.fetch(url, CONFIG.CALLBACK_URL, metadata);
  assert.ok(result.id !== undefined, "invalid response from server");
  assert.ok(result.location !== undefined, "invalid response from server, no response received");
  console.log(`contents submitted for processing with id: ${result.id} and location: ${result.location}`);
  return result;
};

exports.handleS3Event = handleS3Event;
exports.handleApiGatewayEvent = handleApiGatewayEvent;

scaniiClient = new scanii.ScaniiClient(CONFIG.KEY, CONFIG.SECRET, CONFIG.API_ENDPOINT);
