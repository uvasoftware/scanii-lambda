#!/bin/bash

export VERSION=${VERSION}
export ACCOUNT_ID=${ACCOUNT_ID}
APPLICATION="UvaSoftware-Scanii-Lambda"

aws serverlessrepo create-application-version \
 --application-id arn:aws:serverlessrepo:us-east-1:${ACCOUNT_ID}:applications/${APPLICATION} \
 --semantic-version ${VERSION} \
 --source-code-url https://github.com/uvasoftware/scanii-lambda/releases/tag/v${VERSION} \
 --template-body file://scanii-lambda.yaml >/dev/null

echo "SAM application ${APPLICATION} version ${VERSION} published!"
