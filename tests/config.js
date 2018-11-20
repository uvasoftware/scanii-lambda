const assert = require('assert');
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const AWS = require('aws-sdk');
const CONFIG = require('../lib/config').CONFIG;
const actions = require('../lib/actions');

describe('Config tests', () => {

  let deleteCounter = 0;
  let tagCounter = 0;

  beforeEach(() => {
    // resetting
    deleteCounter = tagCounter = 0;

    // for some reason we need to monkey patch this:
    AWS.S3.prototype.deleteObject = () => {
      deleteCounter++;
    };

    AWS.S3.prototype.putObjectTagging = () => {
      tagCounter++;
    };
  });

  it("if all actions are disabled, no action should be taken", async () => {
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = false;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.strictEqual(0, deleteCounter);
    assert.strictEqual(0, tagCounter);
  });
  it("if a single action is enabled, a single action should be taken", async () => {
    CONFIG.ACTION_DELETE_OBJECT = true;
    CONFIG.ACTION_TAG_OBJECT = false;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.strictEqual(1, deleteCounter);
    assert.strictEqual(0, tagCounter);
  });
  it("if a single action is enabled, a single action should be taken - 2", async () => {
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = true;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.strictEqual(0, deleteCounter);
    assert.strictEqual(1, tagCounter);
  });
  it("if 2 actions are enabled then 2 actions should be taken", async () => {
    CONFIG.ACTION_DELETE_OBJECT = true;
    CONFIG.ACTION_TAG_OBJECT = true;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.strictEqual(1, deleteCounter);
    assert.strictEqual(1, tagCounter);
  });
});
