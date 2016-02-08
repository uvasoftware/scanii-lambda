var handler = require('./lib/index.js').handler;
var generateSignature = require('./lib/index.js').generateSignature;
var assert = require('assert');
var context = require('aws-lambda-mock-context');

// Start the test
describe('Scanii-Mu Tests', function () {
  //it('should process a create object event', function (done) {
  //  handler({
  //    "Records": [
  //      {
  //        "eventVersion": "2.0",
  //        "eventSource": "aws:s3",
  //        "awsRegion": "us-west-2",
  //        "eventTime": "2015-10-01T23:28:54.280Z",
  //        "eventName": "ObjectCreated:Put",
  //        "userIdentity": {
  //          "principalId": "AWS:principal"
  //        },
  //        "requestParameters": {
  //          "sourceIPAddress": "98.167.155.191"
  //        },
  //        "responseElements": {
  //          "x-amz-request-id": "EEC943B096DE3DF9",
  //          "x-amz-id-2": "W/myEjyXFBsOA6N0byxW0tOxMA4m1fmv9KAVcovvG0nD9W1s5aX5+Wx61tlCop8LbZAw1Nz0mnc="
  //        },
  //        "s3": {
  //          "s3SchemaVersion": "1.0",
  //          "configurationId": "948c2c1a-a028-4564-93fc-76cea7622633",
  //          "bucket": {
  //            "name": "scanii-mu",
  //            "ownerIdentity": {
  //              "principalId": "principal"
  //            },
  //            "arn": "arn:aws:s3:::scanii-mu"
  //          },
  //          "object": {
  //            "key": "Screen+Shot+2016-01-19+at+7.24.37+PM.png",
  //            "size": 519,
  //            "eTag": "aa1e5c8a6a07217c25f55aa8e96ea37a",
  //            "sequencer": "00560DC1B62F962FCD"
  //          }
  //        }
  //      }
  //    ]
  //  }, context());
  //  context.Promise
  //    .then(function () {
  //      // succeed() called
  //      done();
  //    })
  //    .catch(function (err) {
  //      // fail() called
  //      done(err);
  //    });
  //});

  it('it should handle a callback', function (done) {
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
    }, context());
    context.Promise
      .then(function () {
        // succeed() called
        done();
      })
      .catch(function (err) {
        // fail() called
        done(err);
      });
  });

  //it('it should handle callbacks with findings', function (done) {
  //  handler({
  //    "id": "2e4612793298b1d691202e75dc125f6e",
  //    "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
  //    "content_length": "1251174",
  //    "findings": ['finding1', 'finding2'],
  //    "creation_date": "2016-01-24T15:05:53.260Z",
  //    "content_type": "image/jpeg",
  //    "metadata": {
  //      "signature": generateSignature("test-bucket", "test-key"),
  //      "bucket": "test-bucket",
  //      "key": "test-key"
  //    }
  //  }, context());
  //  context.Promise
  //    .then(function () {
  //      // succeed() called
  //      done();
  //    })
  //    .catch(function (err) {
  //      // fail() called
  //      done(err);
  //    });
  //});

  //it('it should enforce signatures in callbacks', function (done) {
  //  expect(handler({
  //    "id": "2e4612793298b1d691202e75dc125f6e",
  //    "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
  //    "content_length": "1251174",
  //    "findings": ['finding1', 'finding2'],
  //    "creation_date": "2016-01-24T15:05:53.260Z",
  //    "content_type": "image/jpeg",
  //    "metadata": {
  //      "signature": "1234",
  //      "bucket": "test-bucket",
  //      "key": "test-key"
  //    }
  //  }, context())).to.be.ok.throw(AssertionError);
  //});

});

