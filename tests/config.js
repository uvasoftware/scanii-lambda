const assert = require('assert');
const it = require("mocha/lib/mocha.js").it;
const describe = require("mocha/lib/mocha.js").describe;
const AWS = require('aws-sdk');
const nock = require('nock');
const CONFIG = require('../lib/config').CONFIG;
const actions = require('../lib/actions');

describe('Config tests', () => {

  let deleteCounter = 0;
  let tagCounter = 0;
  let snsCounter = 0;

  beforeEach(() => {

    // resetting
    deleteCounter = tagCounter = snsCounter = 0;

    // for some reason we need to monkey patch this:
    AWS.S3.prototype.deleteObject = () => {
      deleteCounter++;
    };
    AWS.SNS.prototype.publish = () => {
      snsCounter++;
    };
    AWS.S3.prototype.copyObject = () => {
      tagCounter++;
    };
  });

  it("if all actions are disabled, no action should be taken", async () => {
    CONFIG.ACTION_PUBLISH_SNS = false;
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = false;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.equal(0, deleteCounter);
    assert.equal(0, tagCounter);
    assert.equal(0, snsCounter);
  });
  it("if a single action is enabled, a single action should be taken", async () => {
    CONFIG.ACTION_PUBLISH_SNS = true;
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = false;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.equal(0, deleteCounter);
    assert.equal(0, tagCounter);
    assert.equal(1, snsCounter);
  });
  it("if 2 actions are enabled then 2 actions should be taken", async () => {
    CONFIG.ACTION_PUBLISH_SNS = true;
    CONFIG.ACTION_DELETE_OBJECT = false;
    CONFIG.ACTION_TAG_OBJECT = true;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.equal(0, deleteCounter);
    assert.equal(1, tagCounter);
    assert.equal(1, snsCounter);
  });
  it("if 3 actions are enabled then 3 actions should be taken", async () => {
    CONFIG.ACTION_PUBLISH_SNS = true;
    CONFIG.ACTION_DELETE_OBJECT = true;
    CONFIG.ACTION_TAG_OBJECT = true;

    await actions.onFindings("bucket1", "key1", {findings: ["bad", "worse"]});
    assert.equal(1, deleteCounter);
    assert.equal(1, tagCounter);
    assert.equal(1, snsCounter);
  });
});
