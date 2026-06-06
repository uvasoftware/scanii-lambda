const CONFIG = {}

if (process.env.AWS_SAM_LOCAL !== undefined) {
  console.log("starting...");
  console.log(process.env);
}

function defaults() {
  // Scanii API credentials. Both handlers require these to authenticate API
  // calls and verify callback metadata.
  CONFIG.KEY = null;
  CONFIG.SECRET = null;

  // Scanii API host without a scheme. The submit handler adds "https://" when
  // constructing the client endpoint.
  CONFIG.API_ENDPOINT = "api-us1.scanii.com";

  // Public callback URL passed to Scanii when submitting S3 objects. The SAM
  // template sets this to the API Gateway callback route after deployment.
  CONFIG.CALLBACK_URL = null;

  // Enables writing Scanii result tags back to the processed S3 object.
  CONFIG.ACTION_TAG_OBJECT = false;

  // Enables deleting S3 objects when Scanii reports one or more findings.
  CONFIG.ACTION_DELETE_OBJECT = false;

  // Maximum number of Scanii API attempts made by the local retry wrapper.
  CONFIG.MAX_ATTEMPTS = 10;

  // Maximum randomized delay between retry attempts, in milliseconds.
  CONFIG.MAX_ATTEMPT_DELAY_MSEC = 30_000;

  // S3 signed URL lifetime, in seconds. This must be long enough for Scanii to
  // fetch the object after the submit handler receives the S3 event.
  CONFIG.SIGNED_URL_DURATION = 3600;

  // Environment variables override the defaults above. SAM deployment
  // parameters set the common customer-facing values, and advanced operators can
  // set the remaining variables directly on the Lambda functions.
  if (process.env.API_KEY) {
    CONFIG.KEY = process.env.API_KEY;
  }
  if (process.env.API_SECRET) {
    CONFIG.SECRET = process.env.API_SECRET;
  }

  if (process.env.API_ENDPOINT) {
    CONFIG.API_ENDPOINT = process.env.API_ENDPOINT;
  }

  if (process.env.ACTION_TAG_OBJECT === "true") {
    CONFIG.ACTION_TAG_OBJECT = true;
  }

  if (process.env.ACTION_DELETE_OBJECT === "true") {
    CONFIG.ACTION_DELETE_OBJECT = true;
  }

  if (process.env.CALLBACK_URL) {
    CONFIG.CALLBACK_URL = process.env.CALLBACK_URL;
  }

  if (process.env.MAX_ATTEMPTS) {
    CONFIG.MAX_ATTEMPTS = process.env.MAX_ATTEMPTS;
  }

  if (process.env.MAX_ATTEMPT_DELAY_MSEC) {
    CONFIG.MAX_ATTEMPT_DELAY_MSEC = process.env.MAX_ATTEMPT_DELAY_MSEC;
  }

  if (process.env.SIGNED_URL_DURATION) {
    CONFIG.SIGNED_URL_DURATION = process.env.SIGNED_URL_DURATION;
  }

}

defaults();
exports.defaults = defaults;
exports.CONFIG = CONFIG;
