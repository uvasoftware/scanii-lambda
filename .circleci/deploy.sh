#!/bin/bash

export LC_ALL=C.UTF-8 # needed by SAM
export LANG=C.UTF-8 # needed by SAM
export AWS_DEFAULT_REGION=us-east-1 # needed by SAM

export APPLICATION="UvaSoftware-Scanii-Lambda"
export ACCOUNT_ID=${ACCOUNT_ID}

# installing AWS CLI
apt-get install -qqy nodejs npm zip python3-pip &>/dev/null
pip3 install awscli aws-sam-cli &>/dev/null

VERSION=$( node -pe "require('./package.json').version")

# building
make build package || exit 100

aws serverlessrepo create-application-version \
 --application-id arn:aws:serverlessrepo:us-east-1:${ACCOUNT_ID}:applications/${APPLICATION} \
 --semantic-version ${VERSION} \
 --source-code-url https://github.com/uvasoftware/scanii-lambda/releases/tag/v${VERSION} \
 --template-body file://scanii-lambda.yaml >/dev/null || exit 99

echo "SAM application ${APPLICATION} version ${VERSION} published!"

git config --global user.email "circleci@uvasoftware.com"
git config --global user.name "CircleCI"
git tag -a v${VERSION} -m "Release by CircleCI v${VERSION}"
git push origin v${VERSION}

# bumping version
npm version patch
VERSION=$( node -pe "require('./package.json').version")
echo "next version is: $VERSION"

#commit version change
git status
git commit -a -m "bump to $VERSION [ci skip]"
git push origin master
