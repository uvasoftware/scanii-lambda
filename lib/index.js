"use strict";

const VERSION = '0.4.1';
const assert = require('assert');
const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const sns = new aws.SNS({apiVersion: '2010-03-31'});
const http = require('https');
const qs = require('querystring');
const crypto = require('crypto');


const onFindings = function (bucket, key, result) {
  const handler1 = new Promise((resolve, reject) => {
    console.log('RESULT:', internalId(bucket, key), 'has findings', result.findings);

    // sample code that delete objects with findings from S3:
    s3.deleteObject({Bucket: bucket, Key: key}, (error) => {
      if (error) {
        console.error(error, error.stack); // an error occurred
        reject(`error while deleting: ${internalId(bucket, key)} please see logs for details`);
      } else {
        console.log('file', internalId(bucket, key), 'deleted');
        resolve(true);
      }
    });
  });

  // example handler that posts a notification in SNS for findings
  const handler2 = new Promise((resolve) => {
    // optional SNS notification:
    const params = {
      Message: `Bucket: ${bucket}/${key} had finding: ${result.findings}`,
      Subject: `[scanii] Finding notification`,
      TopicArn: SNS_TOPIC
    };
    sns.publish(params, () => {
      resolve(true);
    });
  });
  const handlers = [handler1];

  // if an SNS notification topic is defined, honor it:
  if (undefined !== SNS_TOPIC) {
    console.log("dispatching SNS notification to topic:", SNS_TOPIC);
    handlers.push(handler2);
  }

  return Promise.all(handlers);
};

const onNoFindings = function (bucket, key, result) {
  return new Promise((resolve) => {
    console.log('RESULT:', internalId(bucket, key), 'has no findings');
    console.log(`callback for file ${result.id} completed successful`);
    resolve(true);
  });

};


//-------------------------------  Do not edit below this line ----------------------------------------------
const CALLBACK_URL = process.env.CALLBACK_URL;
const SNS_TOPIC = process.env.SNS_TOPIC;
const API_ENDPOINT = '/v2.1/files/';
const KEY = process.env.SCANII_CREDS.split(':')[0];
const SECRET = process.env.SCANII_CREDS.split(':')[1];

const internalId = function (bucket, key) {
  return `s3://${bucket}/${key}`;
};

/**
 * Generates a HMAC-SHA1 digital signature for a bucket/key combination using the SECRET as the key
 * @param bucket the bucket name
 * @param key the key name
 * @returns {string} the digitally signed bucket+key combination
 */
const generateSignature = function (bucket, key) {
  return crypto.createHmac('sha1', SECRET).update(internalId(bucket, key)).digest('hex');
};

/**
 * Handles HTTP result callback
 * @param {Object} event the API gateway event to be processed
 * @param callback the lambda flow control callback
 */
const handleApiGatewayEvent = (event, callback) => {
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
  assert.ok(r.metadata.signature === generateSignature(r.metadata.bucket, r.metadata.key), "invalid signature");
  console.log('signature check passed for signature', r.metadata.signature);

  let handler;

  if (r.findings !== undefined && r.findings.length > 0) {
    console.log("processing callback with findings ", r.findings);

    // if in test mode we really don't dispatch this call
    if (process.env.MOCK_EXTERNAL_SERVICES !== undefined) {
      handler = Promise.resolve(true);
    } else {
      handler = onFindings(r.metadata.bucket, r.metadata.key, r);
    }
  } else {
    handler = onNoFindings(r.metadata.bucket, r.metadata.key, r);
  }

  handler.then((result) => {
    if (result === true) {
      // returns a API gateway lambda proxy confirming response:
      callback(null, {
        "statusCode": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": JSON.stringify({status: "OK"}, null, 2)
      });
    }
  }).catch((error) => {
    console.error(error);
    callback(error);
  });

};

/**
 * Handles events from S3 and submits object for processing
 * @param event {Object} S3 event to be processed
 * @param callback the lambda flow control callback
 */
const handleS3Event = (event, callback) => {
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name;
  // see https://forums.aws.amazon.com/thread.jspa?threadID=215813
  const key = Object.keys(qs.decode(event.Records[0].s3.object.key))[0];

  // sanity checks
  assert(bucket !== undefined, "bucket not present in s3 event");
  assert(key !== undefined, "key not present in s3 event");

  console.log('processing ' + internalId(bucket, key));

  // creating signed url for processing
  const url = s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: 3600 // 1 hour
  });
  console.log('created signed url', url);


  console.log('submitting content for processing');
  // signing request
  const signature = generateSignature(bucket, key);
  console.log('using signature ' + signature);

  const payload = qs.stringify({
    location: url,
    callback: CALLBACK_URL,
    'metadata[signature]': signature,
    'metadata[bucket]': bucket,
    'metadata[key]': key
  });

  const options = {
    auth: KEY + ":" + SECRET,
    port: 443,
    host: 'api.scanii.com',
    path: API_ENDPOINT + 'fetch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': payload.length,
      'User-Agent': 'scanii-lambda-v' + VERSION
    }
  };

  const processResponse = (res, data) => {
    const serviceResponse = JSON.parse(data);
    if (res.statusCode === 202) {
      console.log('file id:', serviceResponse.id);
      callback(null, serviceResponse.id);
    } else {
      console.log(serviceResponse);
      callback(`Error: invalid response from server, message [${serviceResponse.body}] and http code: ${res.statusCode}`);
    }
  };

  // check whether we should return a canned response (used during testing)
  if (process.env.MOCK_EXTERNAL_SERVICES !== undefined) {
    processResponse(event._mock.response, event._mock.data);
  } else {
    // calling scanii API v2.1 (http://docs.scanii.com/v2.1/resources.html):
    const req = http.request(options, function (res) {
      console.log("headers: ", res.headers);
      res.on('data', function (data) {
        processResponse(res, data);
      });
      res.on('error', function (error) {
        callback(error);
      });
    });

    req.write(payload);
    req.end();

  }
};

/**
 * lambda entry point function
 * @param event event to be processed
 * @param context lambda environmental context object
 * @param callback the lambda flow control callback
 */
exports.handler = (event, context, callback) => {
  console.log(">> starting");
  console.log(`>> using key [${KEY}] and function scanii-lambda/v${VERSION}`);
  if (process.env.MOCK_EXTERNAL_SERVICES !== undefined) {
    console.log(">> mocking external calls!");
  }
  console.log('>> received event:', JSON.stringify(event, null, 2));

  try {
    if (event.Records !== undefined) {
      handleS3Event(event, callback);
    } else {
      handleApiGatewayEvent(event, callback);
    }
  } catch (error) {
    console.error(error, error.stack); // an error occurred
    callback(error);
  }
};

exports.generateSignature = generateSignature;
