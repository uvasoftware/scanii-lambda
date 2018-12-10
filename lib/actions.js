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

  const objectPath = utils.internalId(bucket, key);
  console.log(`RESULT: ${objectPath} has findings`, result.findings);
  console.log(`actions delete: ${CONFIG.ACTION_DELETE_OBJECT} tag: ${CONFIG.ACTION_TAG_OBJECT}`);

  if (CONFIG.ACTION_TAG_OBJECT === true) {
    await tagObject(bucket, key, result);
    console.log(`${objectPath} tagging completed`);
  }

  if (CONFIG.ACTION_DELETE_OBJECT === true) {
    await deleteObject(bucket, key);
    console.log(`${objectPath} deletion completed`);
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
  // https://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html

  const S3 = new AWS.S3({apiVersion: '2006-03-01'});

  let params = {
    Bucket: bucket,
    Key: key,
    Tagging: {
      TagSet: []
    }
  };

  // retrieve tagging since we want to append and NOT replace them:
  const existingTags = await S3.getObjectTagging({Bucket: bucket, Key: key}).promise();

  if (existingTags !== undefined) {
    params.Tagging.TagSet = existingTags.TagSet;
  }

  params.Tagging.TagSet.push({
    Key: "ScaniiFindings",
    Value: result.findings.length !== 0 ? utils.formatTagValue(result.findings) : "None"
  });

  params.Tagging.TagSet.push({
    Key: "ScaniiId",
    Value: utils.formatTagValue(result.id)
  });

  params.Tagging.TagSet.push({
    Key: "ScaniiContentType",
    Value: utils.formatTagValue(result.content_type)
  });

  await S3.putObjectTagging(params).promise();
  console.log('file', utils.internalId(bucket, key), 'tagged');

};

/**
 * Handler that deletes objects with findings from S3
 */
const deleteObject = async function (bucket, key) {
  const S3 = new AWS.S3({apiVersion: '2006-03-01'});
  await S3.deleteObject({Bucket: bucket, Key: key}).promise();
};


exports.onFindings = onFindings;
exports.onNoFindings = onNoFindings;
exports.tagObject = tagObject; // exported for testing
