# Uva Software’s scanii-lambda
A Sam-Packaged AWS Lambda client to the [scanii.com](https://scanii.com) content processing engine. For a detailed walk-through of deploying this application see: https://docs.scanii.com/article/151-how-do-i-analyze-content-stored-on-amazon-s3.

## How it works
This is, essentially, a series of lambda functions packaged in a one-click deployable application that configures everything needed so your S3 objects are submitted automatically to scanii’s content analysis [API](https://docs.scanii.com/v2.1/overview.html).  Once the content is processed,  you can choose from a couple of different actions:

1. Tag the content - this is defaulted to on and adds the following tag to objects processed: 
	1. `ScaniiId` -> the resource id of the processed content
	2. `ScaniiFindings` ->  list of identified findings (content engine dependent) 
	3. `ScaniiContentType` -> the identified content type of the file processed 
2. Delete the object with findings - this is defaulted to **off** and will delete S3 objects with findings (such as malware or NSFW content) - for a full list of available content identification see https://support.scanii.com/article/20-content-detection-engines

## Working with the source code
The source code for this application is written using Javascript and requires, at least, nodejs 8 to run. Before getting started we strongly advise you to become familiar with the following technologies: 

1. [Amazon S3](https://aws.amazon.com/s3/)
2. [Amazon Lambda](https://aws.amazon.com/lambda/)
3. [AWS Serverless Application Model (SAM) specification](https://github.com/awslabs/serverless-application-model)

### Building and running tests
Tests utilize Mocha and are triggered into NPM, we provide a makefile to tie everything together: 
```
$ make test
```

### Running the application locally
If you have the SAM CLI (https://github.com/awslabs/aws-sam-cli) installed locally you can run scanii-lambda locally for testing: 

```
$ make run
```

## Deploying it
You can deploy this application by clicking [here.](https://serverlessrepo.aws.amazon.com/#/applications/arn:aws:serverlessrepo:us-east-1:484983087487:applications~UvaSoftware-Scanii-Lambda)  - please note that after deployment you must manually create a trigger event for the `uvasoftware-scanii-lambda-submit` function for your S3 bucket,  under “Add Triggers/S3” and event type `Object Created (All)`
