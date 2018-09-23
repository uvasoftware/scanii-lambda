const crypto = require('crypto');
const CONFIG = require('./config').CONFIG;

/**
 * Generates a HMAC-SHA1 digital signature for a bucket/key combination using the SECRET as the key
 * @param bucket the bucket name
 * @param key the key name
 * @returns {string} the digitally signed bucket+key combination
 */
const generateSignature = function (bucket, key) {
  return crypto.createHmac('sha1', CONFIG.SECRET).update(internalId(bucket, key)).digest('hex');
};

/**
 * Given a bucket name and key, we'll return a S3 URL for it
 * @param bucket
 * @param key
 * @returns {string}
 */
const internalId = (bucket, key) => `s3://${bucket}/${key}`;

exports.internalId = internalId;
exports.generateSignature = generateSignature;


