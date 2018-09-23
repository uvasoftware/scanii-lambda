const VERSION = require('../package.json').version;
const request = require('request');
const assert = require('assert');

/**
 * Minimal Scanii API client in javascript (@see https://docs.scanii.com/v2.1/resources.html)
 */
class ScaniiClient {
  constructor(key, secret, endpoint = "api.scanii.com") {
    this.key = key;
    this.secret = secret;
    this.endpoint = endpoint;
    this.userAgent = `scanii-lambda/v${VERSION}`;
    console.log(`scanii client created using endpoint ${endpoint} and version ${VERSION}`)
  }

  // https://docs.scanii.com/v2.1/resources.html#fetch
  async fetch(location, callback, metadata) {
    const options = {
      url: `https://${this.endpoint}/v2.1/files/fetch`,
      auth: {
        'user': this.key,
        'pass': this.secret,
      },
      headers: {
        'User-Agent': this.userAgent
      },
      method: 'POST',
      form: {
        location: location,
        callback: callback
      }
    };

    if (metadata !== undefined) {
      for (const k in metadata) {
        if (metadata.hasOwnProperty(k)) {
          options.form[`metadata[${k}]`] = metadata[k];
        }
      }
    }
    return new Promise((resolve) => {
      request(options, (error, response, body) => {
        assert.ok(response.statusCode === 202, "Error response from server!");
        let file = JSON.parse(body);
        console.log(`submit successful with id:${file.id}`);
        resolve({id: file.id, location: response.headers.location});
      });
    });
  }
}

exports.ScaniiClient = ScaniiClient;
