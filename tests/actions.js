const assert = require('assert');
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const actions = require('../lib/actions');
const AWS = require('aws-sdk-mock');

describe('Actions tests', () => {

  let putObjectTagCallCount = 0;
  beforeEach(() => {
    putObjectTagCallCount = 0;
  });

  afterEach(function () {
    AWS.restore();
  });

  it('should add correct tags if findings', async () => {
    const result = {
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": ["finding1"],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": "abc",
        "bucket": "test-bucket",
        "key": "test-key"
      }
    };

    AWS.mock('S3', 'putObjectTagging', (params, callback) => {
      assert.ok(params.Bucket === result.metadata.bucket);
      assert.ok(params.Key === result.metadata.key);

      assert.ok(params.Tagging.TagSet[0].Key === "ScaniiFindings");
      assert.ok(params.Tagging.TagSet[0].Value === result.findings.join(' '));

      assert.ok(params.Tagging.TagSet[1].Key === "ScaniiId");
      assert.ok(params.Tagging.TagSet[1].Value === result.id);

      assert.ok(params.Tagging.TagSet[2].Key === "ScaniiContentType");
      assert.ok(params.Tagging.TagSet[2].Value === result.content_type);
      callback();
      putObjectTagCallCount++;
    });

    AWS.mock('S3', 'getObjectTagging', (params, callback) => {
      callback(null, {
        TagSet: []
      });
    });

    await actions.tagObject(result.metadata.bucket, result.metadata.key, result);
    assert(putObjectTagCallCount === 1);
  });

  it('should add correct tags if no findings', async () => {
    const result = {
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": [],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": "abc",
        "bucket": "test-bucket",
        "key": "test-key"
      }
    };

    AWS.mock('S3', 'putObjectTagging', (params, callback) => {
      assert.ok(params.Bucket === result.metadata.bucket);
      assert.ok(params.Key === result.metadata.key);

      assert.ok(params.Tagging.TagSet[0].Key === "ScaniiFindings");
      assert.ok(params.Tagging.TagSet[0].Value === 'None');

      assert.ok(params.Tagging.TagSet[1].Key === "ScaniiId");
      assert.ok(params.Tagging.TagSet[1].Value === result.id);

      assert.ok(params.Tagging.TagSet[2].Key === "ScaniiContentType");
      assert.ok(params.Tagging.TagSet[2].Value === result.content_type);
      callback();
      putObjectTagCallCount++;
      return true;
    });

    AWS.mock('S3', 'getObjectTagging', (params, callback) => {
      callback(null, {
        TagSet: []
      });
    });

    await actions.tagObject(result.metadata.bucket, result.metadata.key, result);
    assert(putObjectTagCallCount === 1);

  });
  it('should truncate tag values', async () => {
    const result = {
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": ["a".repeat(300)],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": "abc",
        "bucket": "test-bucket",
        "key": "test-key"
      }
    };

    AWS.mock('S3', 'putObjectTagging', (params, callback) => {
      assert.ok(params.Tagging.TagSet[0].Key === "ScaniiFindings");
      assert.ok(params.Tagging.TagSet[0].Value.length < 256);
      callback();
      putObjectTagCallCount++;
      return true;
    });

    AWS.mock('S3', 'getObjectTagging', (params, callback) => {
      callback(null, {
        TagSet: []
      });
    });

    await actions.tagObject(result.metadata.bucket, result.metadata.key, result);
    assert(putObjectTagCallCount === 1);
  });

  it('should append not replace tags', async () => {

    AWS.mock('S3', 'putObjectTagging', (params, callback) => {
      assert.ok(params.Bucket === result.metadata.bucket);
      assert.ok(params.Key === result.metadata.key);
      assert.ok(params.Tagging.TagSet.length === 4);
      putObjectTagCallCount++;

    });

    AWS.mock('S3', 'getObjectTagging', (params, callback) => {
      callback(null, {
        TagSet: [
          {
            Key: "Tag1",
            Value: "Value1"
          }
        ]
      });
    });

    const result = {
      "id": "2e4612793298b1d691202e75dc125f6e",
      "checksum": "30d3007d8fa7e76f2741805fbaf1c8bba9a00051",
      "content_length": "1251174",
      "findings": ["malware.a", "malware.b"],
      "creation_date": "2016-01-24T15:05:53.260Z",
      "content_type": "image/jpeg",
      "metadata": {
        "signature": "abc",
        "bucket": "test-bucket",
        "key": "test-key"
      }
    };

    await actions.tagObject(result.metadata.bucket, result.metadata.key, result);
    assert(putObjectTagCallCount === 1);
  });
});
