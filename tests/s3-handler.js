const handler = require('../lib/s3-handler').handler;
const scanii = require('../lib/client');
const assert = require('assert');
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const beforeEach = require("mocha/lib/mocha.js").beforeEach;
const afterEach = require("mocha/lib/mocha.js").afterEach;
const AWS = require('aws-sdk-mock');
const nock = require('nock');
const CONFIG = require('../lib/config').CONFIG;
const sinon = require('sinon');
const {defaults} = require("../lib/config");

"use strict";

describe('S3 handler tests', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.spy(scanii.ScaniiClient);

    CONFIG.CALLBACK_URL = "https://example.com/callback/";
    CONFIG.KEY = "k";
    CONFIG.SECRET = "s";
    CONFIG.MAX_ATTEMPTS = 1;
    CONFIG.MAX_ATTEMPT_DELAY_MSEC = 1_000;
    CONFIG.SIGNED_URL_DURATION = 10;
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    defaults();
  });

  it('should process a create object event', async () => {
    nock('https://api-us1.scanii.com')
      .post('/v2.2/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"), {"Location": "https://api-us1.scanii.com/v2.2/files/1234"});

    await handler({
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
    }, {}, (error, result) => {
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 200, "should return the file id");
    });
  });

  it('should fail to process a s3 event missing the object key', async () => {

    nock('https://api-us1.scanii.com')
      .post('/v2.2/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"), {"Location": "https://api-us1.scanii.com/v2.2/files/1234"});

    await handler({
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
    }, {}, (error, result) => {
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 500, "should return the file id");
      assert(result.body.includes("key not present"));
    });
  });

  it('should fail to process a s3 event missing the object bucket', async () => {

    nock('https://api-us1.scanii.com')
      .post('/v2.2/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"), {"Location": "https://api-us1.scanii.com/v2.2/files/1234"});


    await handler({
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
    }, {}, (error, result) => {
      assert(error === null, "there should be no errors");
      assert(result.statusCode === 500, "should return the file id");
      assert(result.body.includes("bucket not present"));
    });
  });
  it('should fail to process a directory', async () => {

    nock('https://api-us1.scanii.com')
      .post('/v2.2/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"), {"Location": "https://api-us1.scanii.com/v2.2/files/1234"});

    await handler({
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
              "key": "Screen+Shot+2016-01-19+at+7.24.37+PM.png",
              "sequencer": "00560DC1B62F962FCD"
            }
          }
        }
      ]
    }, {}, (error, result) => {
      assert(error === null, "there should be no errors");
      assert(result.body.includes("cannot process directory"));
    });
  });
  it('should honor configurable signed url timeout', async () => {

    nock('https://api-us1.scanii.com')
      .post('/v2.2/files/fetch')
      .reply(202, Buffer.from("{\"id\":\"12356789\"}"), {"Location": "https://api-us1.scanii.com/v2.2/files/1234"});

    AWS.mock('S3', 'getSignedUrl',  (operator,params) => {
      assert.ok(params.Expires === CONFIG.SIGNED_URL_DURATION);
      return true;
    })

    return await handler({
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

    }, {}, (error, result) => {
      assert.ok(error === null, "there should be no errors");
      assert.ok(result.statusCode === 200, "signed url timeout not configurable");

    });
  });
})

