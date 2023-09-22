const CONFIG = {}

if (process.env.AWS_SAM_LOCAL !== undefined) {
  console.log("starting...");
  console.log(process.env);
}

function getScaniiAPISecrets() {
  const headers = {"X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN}
  const scaniiAPISecrets = process.env.SCANII_API_SECRETS_NAME;
  return fetch(`http://localhost:2773/secretsmanager/get?secretId=${scaniiAPISecrets}`, {
    method: 'GET',
    headers: headers,
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('API request failed with status: ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      return data.SecretString;
    })
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

// extracting config overwrites from the environment:
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

var secrets = getScaniiAPISecrets()
  .then(function (secretString) {
    secrets = JSON.parse(secretString)
    CONFIG.KEY = secrets['API_KEY'];
    CONFIG.SECRET = secrets['API_SECRET'];
  });

exports.defaults = defaults;
exports.CONFIG = CONFIG;
