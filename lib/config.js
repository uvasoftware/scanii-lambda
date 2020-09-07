const CONFIG = {}

if (process.env.AWS_SAM_LOCAL !== undefined) {
  console.log("starting...");
  console.log(process.env);
}

function defaults() {
  CONFIG.KEY = null;
  CONFIG.SECRET = null;
  CONFIG.API_ENDPOINT = "api.scanii.com";
  CONFIG.CALLBACK_URL = null;
  CONFIG.ACTION_TAG_OBJECT = false;
  CONFIG.ACTION_DELETE_OBJECT = false;
  CONFIG.MAX_ATTEMPTS = 10;

// extracting config overwrites from the environment:
  if (process.env.API_KEY) {
    CONFIG.KEY = process.env.API_KEY;
  }
  if (process.env.API_SECRET) {
    CONFIG.SECRET = process.env.API_SECRET;
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

}

defaults();
exports.defaults = defaults;
exports.CONFIG = CONFIG;
