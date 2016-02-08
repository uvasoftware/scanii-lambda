var VERSION = 0.3;
var util = require('util');
var assert = require('assert');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var http = require('https');
var qs = require('querystring');
var crypto = require('crypto');

// replace below with your credentials in the form key:secret
// to create your key go to https://scanii.com/account/settings/keys
var SCANII_CREDS = 'CHANGE';
// replace with the URL of your callback lambda function
var CALLBACK_URL = 'ME';


onFindings = function (bucket, key, result, context) {
  console.log('RESULT:', internalId(bucket, key), 'has findings', result.findings);
  var pending = true;

  // sample code that delete objects with findings from S3:
  var req = s3.deleteObject({Bucket: bucket, Key: key});
  req.on('success', function (response) {
    console.log(console.log('file', internalId(bucket, key), 'deleted'));
    context.succeed(util.format('callback for file %s completed successful', result.id));
    pending = false;

  }).on('error', function (response) {
    console.log(console.log('error while deleting', internalId(bucket, key)));
    context.fail(response);
    pending = false;
  });
  req.send();
  var waitWhilePending = function () {
    if (pending) {
      console.log('waiting');
      setTimeout(waitWhilePending, 100);
    }
  };
  setTimeout(waitWhilePending, 100);

};

onNoFindings = function (bucket, key, result, context) {
  console.log('RESULT:', internalId(bucket, key), 'has no findings');
  context.succeed(util.format('callback for file %s completed successful', result.id));

};


//-------------------------------  Do not edit below this line ----------------------------------------------

// if the credentials are passed via an env variable we honor it:
if (process.env.SCANII_CREDS !== undefined) {
  console.log('loading credentials from environment variable');
  SCANII_CREDS = process.env.SCANII_CREDS;
}

const API_ENDPOINT = '/v2.1/files/';

console.log('loading function v', VERSION);

var KEY = SCANII_CREDS.split(':')[0];
var SECRET = SCANII_CREDS.split(':')[1];
console.log('using key', KEY);

var internalId = function (bucket, key) {
  return util.format('s3://%s/%s', bucket, key);
};

var generateSignature = function (bucket, key) {
  return crypto.createHmac('sha1', SECRET).update(internalId(bucket, key)).digest('hex');
};

/**
 * Handles HTTP result callback
 */
var handleCallback = function (event, context) {
  console.log('handling callback event');

  var r = event;
  //console.log('response:', JSON.stringify(r, null, 2));
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

  if (r.findings !== undefined) {
    if (r.findings.length > 0) {
      onFindings(r.metadata.bucket, r.metadata.key, r, context);
    } else {
      onNoFindings(r.metadata.bucket, r.metadata.key, r, context);
    }
  }

};


/**
 * Handles S3 event and submits content for processing
 */
var handleS3Event = function (event, context) {
  console.log('handling S3 event');

  // Get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  // see https://forums.aws.amazon.com/thread.jspa?threadID=215813
  var key = Object.keys(qs.decode(event.Records[0].s3.object.key))[0];

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
      'User-Agent': 'scanii-lambda/v' + VERSION
    }
  };
  console.log(payload);
  // calling scanii API v2.1 (http://docs.scanii.com/v2.1/resources.html):
  var req = http.request(options, function (res) {
    console.log("headers: ", res.headers);

    res.on('data', function (data) {
      var serviceResponse = JSON.parse(data);
      if (res.statusCode == 202) {
        console.log('file id:', serviceResponse.id);
        context.succeed(serviceResponse.id);
      } else {
        console.log(serviceResponse);
        context.fail(util.format("Error: invalid response from server, message [%s] and http code: %d", serviceResponse.body, res.statusCode));
      }
    });
    res.on('error', function (error) {
      context.fail(error);
    });
  });

  req.write(payload);
  req.end();

};

exports.handler = function (event, context) {
  console.log('received event:', JSON.stringify(event, null, 2));
  if (event.Records !== undefined) {
    handleS3Event(event, context);
  } else {
    handleCallback(event, context);
  }
};

exports.generateSignature = generateSignature;
