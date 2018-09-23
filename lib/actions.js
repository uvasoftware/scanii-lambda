const AWS = require('aws-sdk');
const utils = require('./utils');
const CONFIG = require('./config').CONFIG;
const assert = require('assert');

/**
 * Callback function that fires whenever a result has findings
 * @param bucket the bucket the result relates to
 * @param key the key the result relates to
 * @param result the processing result
 * @returns {Promise}
 */
const onFindings = async function (bucket, key, result) {

  assert(bucket !== undefined);
  assert(key !== undefined);
  assert(result !== undefined);

  console.log('RESULT:', utils.internalId(bucket, key), 'has findings', result.findings);


  if (CONFIG.ACTION_TAG_OBJECT === true) {
    await tagObject(bucket, key, result);
  }

  if (CONFIG.ACTION_DELETE_OBJECT === true) {
    await deleteObject(bucket, key, result);
  }

  if (CONFIG.ACTION_PUBLISH_SNS === true) {
    await notifySns(bucket, key, result);
  }

  return true;
};

/**
 * Function that adds custom metadata to an S3 object by a server side copy command
 * @param bucket
 * @param key
 * @param result
 * @returns {Promise<void|boolean>}
 */
const tagObject = async function (bucket, key, result) {
  const S3 = new AWS.S3({apiVersion: '2006-03-01'});
  const params = {
    Bucket: bucket,
    CopySource: "/" + bucket + "/" + key,
    Key: key,
    Metadata: {
      ScaniiResult: JSON.stringify(result)
    },
    MetadataDirective: "COPY"
  };

  return S3.copyObject(params, function (error, data) {
    if (error) {
      console.error(error, error.stack); // an error occurred
      throw new Error(`error while tagging: ${utils.internalId(bucket, key)} please see logs for details`);
    } else {
      console.log('file', utils.internalId(bucket, key), 'tagged');
      return true;
    }
  });
};

/**
 * Handler that deletes objects with findings from S3
 */
const deleteObject = async function (bucket, key, result) {
  const S3 = new AWS.S3({apiVersion: '2006-03-01'});
  // sample code that delete objects with findings from S3:
  return S3.deleteObject({Bucket: bucket, Key: key}, (error) => {
    if (error) {
      console.error(error, error.stack); // an error occurred
      throw new Error(`error while deleting: ${utils.internalId(bucket, key)} please see logs for details`);
    } else {
      console.log('file', utils.internalId(bucket, key), 'deleted');
    }
  });
};


/**
 * Handler that posts a results to SNS
 */
const notifySns = async function (bucket, key, result) {
  assert(CONFIG.SNS_TOPIC !== undefined, "SNS notification enabled but no topic configured");

  const SNS = new AWS.SNS({apiVersion: '2010-03-31'});
  // optional SNS notification:
  const params = {
    Message: JSON.stringify(result),
    Subject: `[scanii.com] Processing notification for object ${bucket}/${key}`,
    TopicArn: CONFIG.SNS_TOPIC
  };
  return SNS.publish(params, (error) => {
    if (error) {
      console.error(error, error.stack);
      throw new Error(`error while publish sns message: ${utils.internalId(bucket, key)} please see logs for details`);
    } else {
      console.log('sns message for object ', utils.internalId(bucket, key), ' published');
    }
  });
};

/**
 * Callback function that fires whenever a result DOES NOT have findings
 * @param bucket the bucket the result relates to
 * @param key the key the result relates to
 * @param result the processing result
 * @returns Promise
 */
const onNoFindings = function (bucket, key, result) {
  return new Promise((resolve) => {
    console.log('RESULT:', utils.internalId(bucket, key), 'has no findings');
    console.log(`callback for file ${result.id} completed successful`);
    resolve(true);
  });

};

exports.onFindings = onFindings;
exports.onNoFindings = onNoFindings;

