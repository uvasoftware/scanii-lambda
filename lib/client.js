const VERSION = require('../package.json').version;
const assert = require('assert');
const axios = require('axios');
const querystring = require('querystring')

/**
 * Minimal Scanii API client in javascript (@see https://docs.scanii.com/v2.1/resources.html)
 */
class ScaniiClient {
  constructor(key, secret, endpoint = "api.scanii.com", maxAttempts = 10) {
    this.key = key;
    this.secret = secret;
    this.maxAttempts = maxAttempts;
    this.userAgent = `scanii-lambda/v${VERSION}`;
    this.client = axios.create({
      auth: {
        username: key, password: secret
      },
      headers: {
        'User-Agent': this.userAgent
      },
      baseURL: `https://${endpoint}`
    });
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
    let data = {
      location: location
    }

    if (callback !== null) {
      data.callback = callback;
    }
    if (metadata !== null) {
      for (const k in metadata) {
        if (metadata.hasOwnProperty(k)) {
          data[`metadata[${k}]`] = metadata[k];
        }
      }
    }

    return await this._retry(async () => {
      const response = await this.client.post('/v2.1/files/fetch', querystring.stringify(data), {headers: {'content-type': 'application/x-www-form-urlencoded'}});
      assert.ok(response.status === 202, `Invalid response from server, with HTTP code: ${response.status}`);
      console.log(`submit successful with id: ${response.data.id}`);
      return ({id: response.data.id, location: response.headers.location});
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Fetches the results of a previously processed file @see <a href="http://docs.scanii.com/v2.1/resources.html#files">http://docs.scanii.com/v2.1/resources.html#files</a>
   * @param id of the content/file to be retrieved
   * @returns {Promise<*>}
   */
  async retrieve(id) {
    return await this._retry(async () => {
      const response = await this.client.get(`/v2.1/files/fetch/${id}`);
      assert.ok(response.status === 200, `Invalid response from server, with HTTP code: ${response.status}`);
      let result = JSON.parse(response.data);
      console.log(`retrieve successful with id: ${result.id}`);
      return result;
    });
  }

  /**
   * Wraps an async function call around a basic retry logic
   * @param func
   * @returns {Promise<void>}
   * @private
   */
  async _retry(func) {
    let attempt = 1;
    while (attempt <= this.maxAttempts) {
      if (attempt > 1) {
        const wait = Math.round(Math.random() * 30_000);
        console.log(`retrying is enabled, going to wait ${wait}ms and try again`);
        await new Promise(resolve => setTimeout(resolve, wait));
      }

      try {
        return await func()
      } catch (e) {
        console.error(e.message);
      } finally {
        attempt++
      }
    }

    throw new ScaniiError(attempt - 1);
  }
}

class ScaniiError extends Error {
  constructor(attempts) {
    super(`Scanii ERROR, could not get a successful response from service after ${attempts} attempts`);
    this.attempts = attempts;
  }
}

exports.ScaniiClient = ScaniiClient;
exports.ScaniiError = ScaniiError;
