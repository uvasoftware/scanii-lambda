var handler = require('./lib/index.js').handler;
var assert = require('assert');
var context = require('aws-lambda-mock-context');


// Start the test
describe('Scanii-Mu Tests', function () {
    it('should process a create object event', function (done) {
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
                            "key": "016.xml",
                            "size": 519,
                            "eTag": "aa1e5c8a6a07217c25f55aa8e96ea37a",
                            "sequencer": "00560DC1B62F962FCD"
                        }
                    }
                }
            ]
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

});

