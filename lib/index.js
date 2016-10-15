var VERSION = '0.4.0';
var assert = require('assert');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var http = require('https');
var qs = require('querystring');
var crypto = require('crypto');

// replace below with your credentials in the form key:secret
// to create your key go to https://scanii.com/account/settings/keys
var SCANII_CREDS = 'CHANGE:ME';
// replace with the URL of your callback lambda function
var CALLBACK_URL = 'CHANGE_ME';

var onFindings = function (bucket, key, result) {
  return new Promise((resolve, reject) => {
    "use strict";
    console.log('RESULT:', internalId(bucket, key), 'has findings', result.findings);

    // sample code that delete objects with findings from S3:
    s3.deleteObject({Bucket: bucket, Key: key}, (error, data) => {
      if (error) {
        console.error(error, error.stack); // an error occurred
        reject(`error while deleting: ${internalId(bucket, key)} please see logs for details`);
      } else {
        console.log('file', internalId(bucket, key), 'deleted');
        resolve(true);
      }
    });
  });
};

var onNoFindings = function (bucket, key, result) {
  return new Promise((resolve, reject) => {
    "use strict";
    console.log('RESULT:', internalId(bucket, key), 'has no findings');
    console.log(`callback for file ${result.id} completed successful`);
    resolve(true);
  });

};


//-------------------------------  Do not edit below this line ----------------------------------------------

// if the credentials are passed via an env variable we honor it:
if (process.env.SCANII_CREDS !== undefined) {
  console.log('loading credentials from environment variable');
  SCANII_CREDS = process.env.SCANII_CREDS;
}

const API_ENDPOINT = '/v2.1/files/';
const KEY = SCANII_CREDS.split(':')[0];
const SECRET = SCANII_CREDS.split(':')[1];

var internalId = function (bucket, key) {
  return `s3://${bucket}/${key}`;
};

/**
 * Generates a HMAC-SHA1 digital signature for a bucket/key combination using the SECRET as the key
 * @param bucket the bucket name
 * @param key the key name
 * @returns {string} the digitally signed bucket+key combination
 */
var generateSignature = function (bucket, key) {
  return crypto.createHmac('sha1', SECRET).update(internalId(bucket, key)).digest('hex');
};

/**
 * Handles HTTP result callback
 * @param {Object} event the API gateway event to be processed
 * @param callback the lambda flow control callback
 */
var handleApiGatewayEvent = (event, callback) => {
  console.log('handling callback event');

  var r = event;
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
  assert.ok(r.metadata.signature == generateSignature(r.metadata.bucket, r.metadata.key), "invalid signature");
  console.log('signature check passed for signature', r.metadata.signature);

  var handler;

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

  handler.then((result)=> {
    "use strict";
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
  }).catch((error)=> {
    "use strict";
    console.error(error);
    callback(error);
  });

};

/**
 * Handles events from S3 and submits object for processing
 * @param event {Object} S3 event to be processed
 * @param callback the lambda flow control callback
 */
var handleS3Event = (event, callback) => {
  // Get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  // see https://forums.aws.amazon.com/thread.jspa?threadID=215813
  var key = Object.keys(qs.decode(event.Records[0].s3.object.key))[0];

  // sanity checks
  assert(bucket !== undefined, "bucket not present in s3 event");
  assert(key !== undefined, "key not present in s3 event");

  console.log('processing ' + internalId(bucket, key));

  // creating signed url for processing
  var url = s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: 3600 // 1 hour
  });
  console.log('created signed url', url);


  console.log('submitting content for processing');
  // signing request
  var signature = generateSignature(bucket, key);
  console.log('using signature ' + signature);

  var payload = qs.stringify({
    location: url,
    callback: CALLBACK_URL,
    'metadata[signature]': signature,
    'metadata[bucket]': bucket,
    'metadata[key]': key
  });

  var options = {
    auth: SCANII_CREDS,
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

  var processResponse = (res, data) => {
    "use strict";
    var serviceResponse = JSON.parse(data);
    if (res.statusCode == 202) {
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
    var req = http.request(options, function (res) {
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
