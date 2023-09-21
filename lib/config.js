const CONFIG = {}

if (process.env.AWS_SAM_LOCAL !== undefined) {
  console.log("starting...");
  console.log(process.env);
}

const headers = {"X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN}
const scaniiAPISecrets = process.env.SCANII_API_SECRETS_NAME;

async function getScaniiAPISecrets () {
    let response = await fetch(`http://localhost:2773/secretsmanager/get?secretId=${scaniiAPISecrets}`, {
        method: 'GET',
        headers: headers
    });
    let data = await response.json();

    return data.SecretString;
}

function defaults() {
  CONFIG.KEY = null;
  CONFIG.SECRET = null;
  CONFIG.API_ENDPOINT = "api.scanii.com";
  CONFIG.CALLBACK_URL = null;
  CONFIG.ACTION_TAG_OBJECT = false;
  CONFIG.ACTION_DELETE_OBJECT = false;
  CONFIG.MAX_ATTEMPTS = 10;
  CONFIG.MAX_ATTEMPT_DELAY_MSEC = 30_000;

  const SCANII_API_SECRETS = getScaniiAPISecrets();
  CONFIG.KEY = SCANII_API_SECRETS['API_KEY'];
  CONFIG.SECRET = SCANII_API_SECRETS['API_SECRET'];

// extracting config overwrites from the environment:
  // if (process.env.API_KEY) {
  //   CONFIG.KEY = process.env.API_KEY;
  // }
  // if (process.env.API_SECRET) {
  //   CONFIG.SECRET = process.env.API_SECRET;
  // }

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

}

defaults();
exports.defaults = defaults;
exports.CONFIG = CONFIG;
