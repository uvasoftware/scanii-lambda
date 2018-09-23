CONFIG = {
  KEY: "key",
  SECRET: "secret",
  API_ENDPOINT: "api.scanii.com",
  CALLBACK_URL: "https://example.com",
  SNS_TOPIC: "sns://topic1",
  ACTION_TAG_OBJECT: false,
  ACTION_DELETE_OBJECT: false,
  ACTION_PUBLISH_SNS: false
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

if (process.env.ACTION_PUBLISH_SNS === "true") {
  CONFIG.ACTION_PUBLISH_SNS = true;
  if (process.env.SNS_TOPIC !== undefined) {
    CONFIG.SNS_TOPIC = process.env.SNS_TOPIC;
  } else {
    throw new Error("Enabling SNS publishing action requires a SNS topic to be specified")
  }
}

if (process.env.ACTION_TAG_OBJECT === "true") {
  CONFIG.ACTION_TAG_OBJECT = true;
}

if (process.env.ACTION_DELETE_OBJECT === "true") {
  CONFIG.ACTION_DELETE_OBJECT = true;
}

if (process.env.CALLBACK_URL) {
  CONFIG.CALLBACK_URL = true;
}

exports.CONFIG = CONFIG;
