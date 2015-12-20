var VERSION = 0.2;

var util = require('util');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var http = require('https');
var qs = require('querystring');
var crypto = require('crypto');

// replace below with your credentials in the form key:secret
// to create your key go to https://scanii.com/account/settings/keys
var SCANII_CREDS = 'KEY:SECRET';

// Do not edit below this line

const API_ENDPOINT = '/v2.1/files/';

console.log('Loading function v', VERSION);

var KEY = SCANII_CREDS.split(':')[0];
var SECRET = SCANII_CREDS.split(':')[1];

var internalId = function(bucket, key) {
  return util.format('processing s3://%s/%s', bucket, key);
};

exports.handler = function (event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;

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
  var signature = crypto.createHmac('sha1', SECRET).update(internalId(bucket, key)).digest('hex');
  console.log('using signature ' + signature);

  var payload = qs.stringify({
    location: url,
    'metadata[hmac]': signature,
    'metadata[id]': internalId(bucket, key)
  });

  console.log(payload);

  var options = {
    auth: SCANII_CREDS,
    port: 443,
    host: 'api.scanii.com',
    path: API_ENDPOINT + 'fetch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': payload.length,
      'User-Agent': 'scanii-mu/v' + VERSION
    }
  };

  // calling scanii API v2.1 (http://docs.scanii.com/v2.1/resources.html):
  var req = http.request(options, function (res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    res.on('data', function (data) {
      var serviceResponse = JSON.parse(data);
      console.log('file id:', serviceResponse.id);
      context.succeed('OK - id ' + serviceResponse.id);
    });
  });

  req.write(payload);
  req.end();

  req.on('error', function (error) {
    console.log(error);
    context.fail(error);
  });
};
