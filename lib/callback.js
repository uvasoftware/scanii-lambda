var VERSION = 0.1;

var util = require('util');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var http = require('https');
var qs = require('querystring');
const API_ENDPOINT = '/v2.1/files/';

console.log('Loading function v', VERSION);

// replace below with your credentials in the form key:secret
// to create your key go to https://scanii.com/account/settings/keys
var SCANII_CREDS = 'KEY:SECRET';

// callbacks

onFindings = function (bucket, key, result) {
  console.log('findings:', result.findings);
};

onNoFindings = function (bucket, key, result) {
  console.log('file has no findings');
};

// do not edit below this line
fetch = function (id, context, bucket, key) {
  console.log('looking up ', id);
  var req = http.request({
    auth: SCANII_CREDS,
    port: 443,
    host: 'api.scanii.com',
    path: API_ENDPOINT + id,
    method: 'GET'
  }, function (res) {
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);

    if (res.statusCode == 200) {
      console.log('response found, processing');
    } else {
      console.log('response pending, waiting');
      setTimeout(fetch(id, context), 1000);
      return;
    }
    res.on('data', function (data) {
      var r = JSON.parse(data);
      console.log('response:', JSON.stringify(r, null, 2));

      if (r.findings !== undefined) {
        if (r.findings.size > 0) {
          onFindings(bucket, key, r);
        } else {
          onNoFindings(bucket, key, r);
        }

      }
      context.done();
    });
  });
  req.end();
  req.on('error', function (error) {
    console.log(error);
  });
};

exports.handler = function (event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;

  console.log(util.format('processing s3://%s/%s', bucket, key));

  // creating signed url for processing
  var url = s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: 3600 // 1 hour
  });
  console.log('created signed url', url);
  console.log('submitting content for malware processing');

  var payload = qs.stringify({
    location: url
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
      // polling for response:
      setTimeout(fetch(serviceResponse.id, context, bucket, key), 1000);
    });
  });

  req.write(payload);
  req.end();

  req.on('error', function (error) {
    console.log(error);
  });
};
