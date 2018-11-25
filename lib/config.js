CONFIG = {
  KEY: null,
  SECRET: null,
  API_ENDPOINT: "api.scanii.com",
  CALLBACK_URL: null,
  ACTION_TAG_OBJECT: false,
  ACTION_DELETE_OBJECT: false,
};

if (process.env.AWS_SAM_LOCAL !== undefined) {
  console.log("starting...");
  console.log(process.env);
}

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

exports.CONFIG = CONFIG;
