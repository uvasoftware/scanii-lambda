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

  /**
   * Makes a fetch call to scanii @see <a href="http://docs.scanii.com/v2.1/resources.html#files">http://docs.scanii.com/v2.1/resources.html#files</a>
   * @param location (URL) of the content to be processed
   * @param callback callback location (URL) to be notified and receive the result
   * @param metadata optional metadata to be added to this file
   * @returns {Promise<*>}
   */

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
      }
    };

    if (callback !== null) {
      options.form.callback = callback;
    }

    if (metadata !== null) {
      for (const k in metadata) {
        if (metadata.hasOwnProperty(k)) {
          options.form[`metadata[${k}]`] = metadata[k];
        }
      }
    }
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          assert.ok(response.statusCode === 202, `Invalid response from server, with HTTP code: ${response.statusCode}`);
          let file = JSON.parse(body);
          console.log(`submit successful with id: ${file.id}`);
          resolve({id: file.id, location: response.headers.location});
        }
      });
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Fetches the results of a previously processed file @see <a href="http://docs.scanii.com/v2.1/resources.html#files">http://docs.scanii.com/v2.1/resources.html#files</a>
   * @param id of the content/file to be retrieved
   * @returns {Promise<*>}
   */
  async retrieve(id) {
    const options = {
      url: `https://${this.endpoint}/v2.1/files/${id}`,
      auth: {
        'user': this.key,
        'pass': this.secret,
      },
      headers: {
        'User-Agent': this.userAgent
      },
      method: 'GET'
    };

    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
        }
        assert.ok(response.statusCode === 200, `Invalid response from server, with HTTP code: ${response.statusCode}`);
        let result = JSON.parse(body);
        console.log(`retrieve successful with id: ${result.id}`);
        resolve(result);

      });
    });
  }

}

exports.ScaniiClient = ScaniiClient;
