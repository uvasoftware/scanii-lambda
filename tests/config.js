const assert = require('assert');
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const CONFIG = require('../lib/config').CONFIG;
const actions = require('../lib/actions');
const AWS = require('aws-sdk-mock');

describe('Config tests', () => {

  let deleteCounter = 0;
  let tagCounter = 0;
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

  beforeEach(() => {
    // resetting
    deleteCounter = tagCounter = 0;

    // for some reason we need to monkey patch this:
    AWS.mock('S3', 'deleteObject', () => {
      deleteCounter++;
    });

    AWS.mock('S3', 'putObjectTagging', () => {
      tagCounter++;
    });

    AWS.mock('S3', 'getObjectTagging', (params, callback) => {
      callback(null, {
        TagSet: []
      });
    });
  });

  afterEach(function () {
    AWS.restore();
  });

  it("if all actions are disabled, no action should be taken", async () => {
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = false;

    await actions.onFindings("bucket1", "key1", result);
    assert.strictEqual(0, deleteCounter);
    assert.strictEqual(0, tagCounter);
  });
  it("if a single action is enabled, a single action should be taken", async () => {
    CONFIG.ACTION_DELETE_OBJECT = true;
    CONFIG.ACTION_TAG_OBJECT = false;

    await actions.onFindings("bucket1", "key1", result);
    assert.strictEqual(1, deleteCounter);
    assert.strictEqual(0, tagCounter);
  });
  it("if a single action is enabled, a single action should be taken - 2", async () => {
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = true;

    await actions.onFindings("bucket1", "key1", result);
    assert.strictEqual(0, deleteCounter);
    assert.strictEqual(1, tagCounter);
  });
  it("if 2 actions are enabled then 2 actions should be taken", async () => {
    CONFIG.ACTION_DELETE_OBJECT = true;
    CONFIG.ACTION_TAG_OBJECT = true;

    await actions.onFindings("bucket1", "key1", result);
    assert.strictEqual(1, deleteCounter);
    assert.strictEqual(1, tagCounter);
  });
});
