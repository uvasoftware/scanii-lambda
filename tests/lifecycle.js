const handler = require('../lib/index.js').handler;
const generateSignature = require('../lib/index.js').generateSignature;
const assert = require('assert');
const context = require('aws-lambda-mock-context');
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const AWS = require('aws-sdk');
const nock = require('nock');


// Start the test
describe('Lifecycle tests', () => {
  beforeEach(() => {


    // wrapping some fakes around the AWS sdk:
    AWS.S3.prototype.getSignedUrl = () => 'https://example.com/1234?q=124';

    // for some reason we need to monkey patch this:
    AWS.S3.prototype.deleteObject = (options, callback) => {
      callback();
    };
    AWS.SNS.prototype.publish = () =>{
      return true;
    };

  });

  nock('https://api.scanii.com')
    .post('/v2.1/files/fetch')
    .reply(202, Buffer.from("{\"id\":\"12356789\"}"));

  it('should process a create object event', done => {

    handler({
      "Records": [
        {
          "eventVersion": "2.0",
          "eventSource": "aws:s3",
          "awsRegion": "us-west-2",
          "eventTime": "2015-10-01T23:28:54.280Z",
          "eventName": "ObjectCreated:Put",
          "userIdentity": {
            "principalId": "AWS:principal"
          },
          "requestParameters": {
            "sourceIPAddress": "98.167.155.191"
          },
          "responseElements": {
            "x-amz-request-id": "EEC943B096DE3DF9",
            "x-amz-id-2": "W/myEjyXFBsOA6N0byxW0tOxMA4m1fmv9KAVcovvG0nD9W1s5aX5+Wx61tlCop8LbZAw1Nz0mnc="
          },
          "s3": {
            "s3SchemaVersion": "1.0",
            "configurationId": "948c2c1a-a028-4564-93fc-76cea7622633",
            "bucket": {
              "name": "scanii-mu",
              "ownerIdentity": {
                "principalId": "principal"
              },
              "arn": "arn:aws:s3:::scanii-mu"
            },
            "object": {
              "key": "Screen+Shot+2016-01-19+at+7.24.37+PM.png",
              "size": 519,
              "eTag": "aa1e5c8a6a07217c25f55aa8e96ea37a",
              "sequencer": "00560DC1B62F962FCD"
            }
          }
        }
      ]
    }, context(), (error, result) => {
      "use strict";
      assert(error === null, "there should be no errors");
      assert(result === "12356789", "should return the file id");
      done();
    });
  });

  it('should fail to process a s3 event missing the object key', done => {

    nock('https://api.scanii.com')
      .post('/v2.1/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"));


    handler({
      "Records": [
        {
          "eventVersion": "2.0",
          "eventSource": "aws:s3",
          "awsRegion": "us-west-2",
          "eventTime": "2015-10-01T23:28:54.280Z",
          "eventName": "ObjectCreated:Put",
          "userIdentity": {
            "principalId": "AWS:principal"
          },
          "requestParameters": {
            "sourceIPAddress": "98.167.155.191"
          },
          "responseElements": {
            "x-amz-request-id": "EEC943B096DE3DF9",
            "x-amz-id-2": "W/myEjyXFBsOA6N0byxW0tOxMA4m1fmv9KAVcovvG0nD9W1s5aX5+Wx61tlCop8LbZAw1Nz0mnc="
          },
          "s3": {
            "s3SchemaVersion": "1.0",
            "configurationId": "948c2c1a-a028-4564-93fc-76cea7622633",
            "bucket": {
              "name": "scanii-mu",
              "ownerIdentity": {
                "principalId": "principal"
              },
              "arn": "arn:aws:s3:::scanii-mu"
            },
            "object": {
              "size": 519,
              "eTag": "aa1e5c8a6a07217c25f55aa8e96ea37a",
              "sequencer": "00560DC1B62F962FCD"
            }
          }
        }
      ]
    }, context(), (error) => {
      "use strict";
      assert(error !== null, "it should throw an error");
      assert(error.message.includes("key not present"));
      done();
    });
  });

  it('should fail to process a s3 event missing the object bucket', done => {

    nock('https://api.scanii.com')
      .post('/v2.1/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"));


    handler({
      "Records": [
        {
          "eventVersion": "2.0",
          "eventSource": "aws:s3",
          "awsRegion": "us-west-2",
          "eventTime": "2015-10-01T23:28:54.280Z",
          "eventName": "ObjectCreated:Put",
          "userIdentity": {
            "principalId": "AWS:principal"
          },
          "requestParameters": {
            "sourceIPAddress": "98.167.155.191"
          },
          "responseElements": {
            "x-amz-request-id": "EEC943B096DE3DF9",
            "x-amz-id-2": "W/myEjyXFBsOA6N0byxW0tOxMA4m1fmv9KAVcovvG0nD9W1s5aX5+Wx61tlCop8LbZAw1Nz0mnc="
          },
          "s3": {
            "s3SchemaVersion": "1.0",
            "configurationId": "948c2c1a-a028-4564-93fc-76cea7622633",
            "bucket": {
              "ownerIdentity": {
                "principalId": "principal"
              },
              "arn": "arn:aws:s3:::scanii-mu"
            },
            "object": {
              "size": 519,
              "eTag": "aa1e5c8a6a07217c25f55aa8e96ea37a",
              "key": "Screen+Shot+2016-01-19+at+7.24.37+PM.png",
              "sequencer": "00560DC1B62F962FCD"
            }
          }
        }
      ]
    }, context(), (error) => {
      "use strict";
      assert(error !== null, "it should throw an error");
      assert(error.message.includes("bucket not present"));
      done();
    });
  });

  it('should handle a callback without findings', done => {
    handler({
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": [],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": generateSignature("test-bucket", "test-key"),
        "bucket": "test-bucket",
        "key": "test-key"
      }
    }, context(), (error, result) => {
      "use strict";
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 200);
      done();
    });
  });

  it('should handle a bogus callback', done => {
    handler({"hello": "world"},
      context(), (error) => {
        "use strict";
        assert(error !== null, "it should throw an error");
        assert(error.message.includes("no id provided"));
        done();
      });
  });

  it('should require bucket/key in callback metadata', done => {
    handler({
        "id": "2e4612793298b1d691202e75dc125f6e",
        "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
        "content_length": "1251174",
        "findings": [],
        "creation_date": "2016-01-24T15:05:53.260Z",
        "content_type": "image/jpeg",
        "metadata": {
          "signature": generateSignature("test-bucket", "test-key"),
        }
      },
      context(), (error) => {
        "use strict";
        assert(error !== null, "it should throw an error");
        assert(error.message.includes("no bucket supplied in metadata"));
        done();
      });
  });

  it('should handle callbacks with findings', done => {

    handler({
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": ['finding1', 'finding2'],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": generateSignature("test-bucket", "test-key"),
        "bucket": "test-bucket",
        "key": "test-key"
      }
    }, context(), (error, result) => {
      "use strict";
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 200);
      done();
    });
  });

  it('should enforce signatures in callbacks', done => {
    handler({
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": ['finding1', 'finding2'],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": "1234",
        "bucket": "test-bucket",
        "key": "test-key"
      }
    }, context(), (error, result) => {
      "use strict";
      assert(error !== null, "it should throw an error");
      assert(result === undefined);
      assert(error.message.includes("invalid signature"));
      done();
    });
  });

  it('should handle api gateway proxy callbacks', done => {
    handler({
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
      "body": "{\n  \"id\" : \"a62a6f0ba82f6ac11e95d09b8bdf965c\",\n  \"checksum\" : \"4b7fbc3b0ae13fc444f4b4984d643f1f403228a2\",\n  \"content_length\" : 41387,\n  \"findings\" : [ ],\n  \"creation_date\" : \"2016-10-15T00:15:35.264Z\",\n  \"content_type\" : \"application/octet-stream\",\n  \"metadata\" : {\n    \"signature\" : \"" + generateSignature("test-bucket", "test-key") + "\",\n    \"bucket\" : \"test-bucket\",\n    \"key\" : \"test-key\"\n  }\n}"
    }, context(), (error, result) => {
      "use strict";
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 200);
      done();
    });
  });

  it('should handle api gateway proxy callbacks and findings', done => {
    handler({
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
      "body": "{\n  \"id\" : \"a62a6f0ba82f6ac11e95d09b8bdf965c\",\n  \"checksum\" : \"4b7fbc3b0ae13fc444f4b4984d643f1f403228a2\",\n  \"content_length\" : 41387,\n  \"findings\" : [ \"content.malware\" ],\n  \"creation_date\" : \"2016-10-15T00:15:35.264Z\",\n  \"content_type\" : \"application/octet-stream\",\n  \"metadata\" : {\n    \"signature\" : \"" + generateSignature("test-bucket", "test-key") + "\",\n    \"bucket\" : \"test-bucket\",\n    \"key\" : \"test-key\"\n  }\n}"
    }, context(), (error, result) => {
      "use strict";
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 200);
      done();
    });
  });

});

