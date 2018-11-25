const crypto = require('crypto');
const CONFIG = require('./config').CONFIG;
const assert = require('assert');

const SIGNATURE_ALGORITHM = 'sha256';

/**
 * Generates a HMAC-SHA1 digital signature for a bucket/key combination using the SECRET as the key
 * @param bucket the bucket name
 * @param key the key name
 * @returns {string} the digitally signed bucket+key combination
 */
const generateSignature = function (bucket, key) {
  assert(bucket !== undefined);
  assert(key !== undefined);
  assert(typeof CONFIG.SECRET === 'string', 'API key secret must be set for signatures to work');

  return crypto.createHmac(SIGNATURE_ALGORITHM, CONFIG.SECRET).update(internalId(bucket, key)).digest('hex');
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


