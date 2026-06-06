# Scanii Lambda for Amazon S3

Scanii Lambda is a deployable AWS Serverless Application Repository application
that submits new Amazon S3 objects to [Scanii](https://scanii.com/) for content
analysis.

[![Deploy to AWS](https://img.shields.io/badge/Deploy%20to-AWS-FF9900?logo=amazonaws&logoColor=white)](https://serverlessrepo.aws.amazon.com/#/applications/arn:aws:serverlessrepo:us-east-1:484983087487:applications~UvaSoftware-Scanii-Lambda)

Use it when you want S3 uploads scanned for malware, unsafe language, NSFW
content, or other Scanii findings without writing your own Lambda integration.
The full deployment walkthrough is available in
[Analyze content stored on Amazon S3](https://docs.scanii.com/article/151-how-do-i-analyze-content-stored-on-amazon-s3).

## What gets deployed

The application creates:

1. A submit Lambda function that receives S3 object-created events.
2. A callback Lambda function behind API Gateway that receives Scanii results.
3. IAM permissions for the selected bucket so the functions can read objects,
   tag objects, and optionally delete objects with findings.

The submit function creates a short-lived signed S3 URL, sends that URL to
Scanii's async fetch API, and includes the callback URL. When Scanii finishes
processing the object, it calls the callback function. The callback verifies the
request metadata and runs the configured S3 actions.

Existing objects are not scanned automatically. Only object-created events sent
to the submit function are processed.

## Deployment

Deploy the application from the button above or from the
[AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/#/applications/arn:aws:serverlessrepo:us-east-1:484983087487:applications~UvaSoftware-Scanii-Lambda).

Before deploying, have these ready:

1. An existing S3 bucket to monitor.
2. A Scanii API key and secret.
3. The Scanii regional endpoint you want to use.
4. AWS permissions to create Lambda functions, API Gateway resources, IAM roles,
   and S3 event notifications.

Deploy the application in the same AWS Region as the S3 bucket you want to
monitor.

## Parameters

| Parameter | Required | Description |
|---|---:|---|
| `bucketName` | Yes | Existing S3 bucket to monitor. |
| `scaniiApiKey` | Yes | Your Scanii API key. |
| `scaniiApiSecret` | Yes | Your Scanii API secret. |
| `scaniiApiEndpoint` | Yes | Regional Scanii API host. The default is `api-us1.scanii.com`. Use the host only, without `https://`. See [Endpoints and regions](https://docs.scanii.com/article/161-endpoints-and-regions). |
| `actionTagObject` | No | Set to `true` to add Scanii result tags to processed objects. Default: `true`. |
| `actionDeleteObjectOnFinding` | No | Set to `true` to delete objects when Scanii reports findings. Default: `false`. |

For supported endpoint values, see
[Endpoints and regions](https://docs.scanii.com/article/161-endpoints-and-regions).

## Advanced configuration

The deployment parameters cover the standard customer-facing settings. The
Lambda functions also read environment variables for callback URL, retry, and
signed URL behavior. See [lib/config.js](lib/config.js) for the full list and
defaults before overriding those values.

## Required post-deploy step

After the stack finishes deploying, add an S3 trigger to the submit function.
The function name is:

```text
<stack-name>-Submit
```

In the Lambda console:

1. Open the submit function.
2. Choose **Add trigger**.
3. Select **S3**.
4. Select the bucket from `bucketName`.
5. Set the event type to **All object create events**.
6. Add optional prefix or suffix filters if you only want to scan part of the
   bucket.
7. Save the trigger.

New matching uploads will now be submitted to Scanii.

## Actions

### Tag processed objects

When `actionTagObject` is `true`, the callback function preserves existing tags
and appends these tags:

| Tag | Value |
|---|---|
| `ScaniiId` | Scanii resource ID for the processed object. |
| `ScaniiFindings` | Space-separated Scanii findings, or `None` when there are no findings. |
| `ScaniiContentType` | Content type reported by Scanii. |

S3 tag values have length limits, so long finding values are truncated before
they are written.

### Delete objects with findings

When `actionDeleteObjectOnFinding` is `true`, the callback function deletes an
object if Scanii returns one or more findings.

Use this carefully. For a first production deployment, leave deletion disabled,
verify the tags and CloudWatch logs, and then enable deletion after you are
comfortable with the behavior.

For more detail on Scanii finding categories, see
[How do the different detection engines work?](https://docs.scanii.com/article/149-how-do-the-different-detection-engines-work).

## Verifying a deployment

1. Upload a new test object to the monitored bucket.
2. Check the submit function's CloudWatch logs for the Scanii submission ID.
3. Check the callback function's CloudWatch logs for the processing result.
4. If tagging is enabled, verify the S3 object tags.
5. If deletion is enabled and the object has findings, verify the object was
   deleted.

If nothing is submitted, confirm that the S3 trigger exists on
`<stack-name>-Submit`, uses the right bucket, and listens for object-created
events.

## Working with the source code

The application is written for the AWS Lambda Node.js 24 runtime.

Useful commands:

```bash
npm ci
npm test
make test
```

If you have the AWS SAM CLI installed, you can run the local API:

```bash
make run
```

And you can generate a sample S3 event for the submit function:

```bash
make run-submit-event
```

The Scanii API contract is published at
[https://scanii.github.io/openapi/v22/](https://scanii.github.io/openapi/v22/).
