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
    await deleteObject(bucket, key);
  }

  return true;
};


/**
 * Callback function that fires whenever a result DOES NOT have findings
 * @param bucket the bucket the result relates to
 * @param key the key the result relates to
 * @param result the processing result
 * @returns Promise
 */
const onNoFindings = async function (bucket, key, result) {
  assert(bucket !== undefined);
  assert(key !== undefined);
  assert(result !== undefined);

  console.log('RESULT:', utils.internalId(bucket, key), 'has no findings');

  if (CONFIG.ACTION_TAG_OBJECT === true) {
    await tagObject(bucket, key, result);
  }

  console.log(`callback for file ${result.id} completed successful`);

};

/**
 * Function that adds custom tags to an S3 object by a server side copy command
 * @param bucket
 * @param key
 * @param result
 * @returns {Promise<void|boolean>}
 */
const tagObject = async function (bucket, key, result) {
  const S3 = new AWS.S3({apiVersion: '2006-03-01'});

  // https://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html
  // because S3 has some odd tag constraints, we must convert the findings into allowed characters
  let findings = "None";
  if (result.findings.length !== 0) {
    findings = result.findings.join(' ');
  }

  const params = {
    Bucket: bucket,
    Key: key,
    Tagging: {
      TagSet: [
        {
          Key: "ScaniiFindings",
          Value: findings
        },
        {
          Key: "ScaniiId",
          Value: result.id
        },
        {
          Key: "ScaniiContentType",
          Value: result.content_type
        }
      ]
    }
  };

  return S3.putObjectTagging(params, function (error, data) {
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
const deleteObject = async function (bucket, key) {
  const S3 = new AWS.S3({apiVersion: '2006-03-01'});

  return S3.deleteObject({Bucket: bucket, Key: key}, (error) => {
    if (error) {
      console.error(error, error.stack); // an error occurred
      throw new Error(`error while deleting: ${utils.internalId(bucket, key)} please see logs for details`);
    } else {
      console.log('file', utils.internalId(bucket, key), 'deleted');
    }
  });
};


exports.onFindings = onFindings;
exports.onNoFindings = onNoFindings;
exports.tagObject = tagObject; // exported for testing
