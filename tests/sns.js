const handler = require('../lib/index').handler;
const assert = require('assert');
const it = require("mocha/lib/mocha").it;
const describe = require("mocha/lib/mocha").describe;
const AWS = require('aws-sdk');
const utils = require('../lib/utils');
const CONFIG = require('../lib/config').CONFIG;

// Start the test
describe('SNS tests', () => {

  let snsCounter = 0;

  beforeEach(() => {
    snsCounter = 0;

    // for some reason we need to monkey patch this:
    AWS.S3.prototype.deleteObject = () => {};

    AWS.S3.prototype.copyObject = () => {};

    AWS.SNS.prototype.publish = (params) => {
      assert(params.Message !== undefined);
      assert(params.Subject !== undefined);
      assert(params.TopicArn !== undefined);

      console.log(`SNS subject ${params.Subject} topic: ${params.TopicArn}: `, JSON.stringify(params.Message));
      console.log(`SNS message: \n`, JSON.stringify(params.Message));
      snsCounter++;
    };

  });

  it('should send notification on findings', async () => {
    CONFIG.SNS_TOPIC = 'topic1';
    CONFIG.ACTION_PUBLISH_SNS = true;

    await handler({
      "resource": "/scanii-process-content-v2",
      "path": "/scanii-process-content-v2",
      "httpMethod": "POST",
      "headers": {
        "Accept": "*/*",
        "Accept-Encoding": "gzip,deflate",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Viewer-Country": "US",
        "Content-Type": "application/json; charset=UTF-8",
        "Host": "hfxx5vbk0b.execute-api.us-east-1.amazonaws.com",
        "User-Agent": "scanii-jackfruit-v2(see http://docs.scanii.com/ua.html)",
        "Via": "1.1 f4d64c05ae609f6aae2932e779b2944b.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "hruEWjQ7B88uLJYdAMKmtfStn6hRjFijE4OJAPTC4rHXhXJoSFDF4g==",
        "X-Forwarded-For": "54.175.145.37, 54.182.230.45",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https",
        "X-Runtime": "67ms",
        "X-Scanii-Host-Id": "43683883"
      },
      "queryStringParameters": null,
      "pathParameters": null,
      "stageVariables": null,
      "requestContext": {
        "accountId": "42",
        "resourceId": "3rlme6",
        "stage": "prod",
        "requestId": "7e358a83-926c-11e6-8fde-835afbb2a724",
        "identity": {
          "cognitoIdentityPoolId": null,
          "accountId": null,
          "cognitoIdentityId": null,
          "caller": null,
          "apiKey": null,
          "sourceIp": "54.175.145.37",
          "cognitoAuthenticationType": null,
          "cognitoAuthenticationProvider": null,
          "userArn": null,
          "userAgent": "scanii-jackfruit-v2(see http://docs.scanii.com/ua.html)",
          "user": null
        },
        "resourcePath": "/scanii-process-content-v2",
        "httpMethod": "POST",
        "apiId": "hfxx5vbk0b"
      },
      "body": "{\n  \"id\" : \"a62a6f0ba82f6ac11e95d09b8bdf965c\",\n  \"checksum\" : \"4b7fbc3b0ae13fc444f4b4984d643f1f403228a2\",\n  \"content_length\" : 41387,\n  \"findings\" : [ \"content.malware\" ],\n  \"creation_date\" : \"2016-10-15T00:15:35.264Z\",\n  \"content_type\" : \"application/octet-stream\",\n  \"metadata\" : {\n    \"signature\" : \"" + utils.generateSignature("test-bucket", "test-key") + "\",\n    \"bucket\" : \"test-bucket\",\n    \"key\" : \"test-key\"\n  }\n}"
    }, {}, (error, result) => {

      assert(error === null, "there should be no errors");
      assert(result.statusCode === 200);
      assert(snsCounter === 1);
    });
  });
  it('should error if sns is enabled but no topic is configured', async () => {
    CONFIG.SNS_TOPIC = undefined;
    CONFIG.ACTION_PUBLISH_SNS = true;

    await handler({
      "resource": "/scanii-process-content-v2",
      "path": "/scanii-process-content-v2",
      "httpMethod": "POST",
      "headers": {
        "Accept": "*/*",
        "Accept-Encoding": "gzip,deflate",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Viewer-Country": "US",
        "Content-Type": "application/json; charset=UTF-8",
        "Host": "hfxx5vbk0b.execute-api.us-east-1.amazonaws.com",
        "User-Agent": "scanii-jackfruit-v2(see http://docs.scanii.com/ua.html)",
        "Via": "1.1 f4d64c05ae609f6aae2932e779b2944b.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "hruEWjQ7B88uLJYdAMKmtfStn6hRjFijE4OJAPTC4rHXhXJoSFDF4g==",
        "X-Forwarded-For": "54.175.145.37, 54.182.230.45",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https",
        "X-Runtime": "67ms",
        "X-Scanii-Host-Id": "43683883"
      },
      "queryStringParameters": null,
      "pathParameters": null,
      "stageVariables": null,
      "requestContext": {
        "accountId": "42",
        "resourceId": "3rlme6",
        "stage": "prod",
        "requestId": "7e358a83-926c-11e6-8fde-835afbb2a724",
        "identity": {
          "cognitoIdentityPoolId": null,
          "accountId": null,
          "cognitoIdentityId": null,
          "caller": null,
          "apiKey": null,
          "sourceIp": "54.175.145.37",
          "cognitoAuthenticationType": null,
          "cognitoAuthenticationProvider": null,
          "userArn": null,
          "userAgent": "scanii-jackfruit-v2(see http://docs.scanii.com/ua.html)",
          "user": null
        },
        "resourcePath": "/scanii-process-content-v2",
        "httpMethod": "POST",
        "apiId": "hfxx5vbk0b"
      },
      "body": "{\n  \"id\" : \"a62a6f0ba82f6ac11e95d09b8bdf965c\",\n  \"checksum\" : \"4b7fbc3b0ae13fc444f4b4984d643f1f403228a2\",\n  \"content_length\" : 41387,\n  \"findings\" : [ \"content.malware\" ],\n  \"creation_date\" : \"2016-10-15T00:15:35.264Z\",\n  \"content_type\" : \"application/octet-stream\",\n  \"metadata\" : {\n    \"signature\" : \"" + utils.generateSignature("test-bucket", "test-key") + "\",\n    \"bucket\" : \"test-bucket\",\n    \"key\" : \"test-key\"\n  }\n}"
    }, {}, (error, result) => {

      assert(error === null, "there should be no errors");
      assert(result.statusCode === 500);
      assert(snsCounter === 0);
    });
  });

});

