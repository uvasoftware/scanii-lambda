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
  await S3.getObjectTagging({Bucket: bucket, Key: key}, (err, data) => {
    if (err) {
      throw(err)
    } else {
      if (data !== undefined) {
        params.Tagging.TagSet = data.TagSet;
      }
    }
  });

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

  return S3.putObjectTagging(params, function (error, data) {
    if (error) {
      console.log("error while tagging object");
      console.error(error, error.stack); // an error occurred
      console.error(data);
      console.log("end of tagging error");
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
