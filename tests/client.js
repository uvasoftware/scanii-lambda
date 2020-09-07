const assert = require('assert')
const nock = require('nock')
const scanii = require("../lib/client");

describe('client tests', () => {
  afterEach(function () {
    nock.cleanAll();
  });

  it('should retry failed fetch requests', async function () {
    nock('https://api.scanii.com')
      .post('/v2.1/files/fetch')
      .reply(555);

    const client = new scanii.ScaniiClient('foo', 'bar', "https://api.scanii.com", 2)
    try {
      await client.fetch('https://acme.com', 'https://acme.com/callback', {});
    } catch (e) {
      assert.ok(e.attempts === 2)
    }
  });

  it('should retry failed retrieve requests', async function () {
    nock('https://api.scanii.com')
      .post('/v2.1/files/123')
      .reply(555);

    const client = new scanii.ScaniiClient('foo', 'bar', "https://api.scanii.com", 2)
    try {
      await client.retrieve('123');
    } catch (e) {
      assert.ok(e.attempts === 2)
    }
  });

})
