const assert = require('assert');
const actions = require('./actions');
const utils = require('./utils');

/**
 * Handles HTTP result callback
 * @param {Object} event the API gateway event to be processed
 * @param context
 * @param callback
 */
exports.handler = async (event, context, callback) => {
  console.log('handling callback event');

  try {
    assert.ok(event.body !== undefined, "event had no body");

    const result = JSON.parse(event.body);

    // callback sanity checks
    assert.ok(result.id !== undefined, "no id provided");
    assert.ok(result.metadata !== undefined, "no metadata supplied");
    assert.ok(result.metadata.bucket !== undefined, "no bucket supplied in metadata");
    assert.ok(result.metadata.key !== undefined, "no key supplied in metadata");
    assert.ok(result.metadata.signature !== undefined, "no signature supplied in metadata");

    console.log("metadata:", result.metadata);

    // now asserting bucket/keys were not tampered with:
    assert.ok(result.metadata.signature === utils.generateSignature(result.metadata.bucket.toString(), result.metadata.key.toString()), "invalid signature");
    console.log('signature check passed for signature', result.metadata.signature);

    if (result.error === undefined) {
      if (result.findings.length > 0) {
        await actions.onFindings(result.metadata.bucket, result.metadata.key, result);
      } else {
        // we need to error something out here
        await actions.onNoFindings(result.metadata.bucket, result.metadata.key, result);
      }
    }

    // returning callback
    callback(null, {
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({status: "OK"}, null, 2)
    });

  } catch (error) {
    console.error(error, error.stack); // an error occurred
    callback(null, {
      "statusCode": 500,
      "headers": {
        "Content-Type": "application/json"
      },
      "body": JSON.stringify({status: error.message}, null, 2)
    });
  }


};
