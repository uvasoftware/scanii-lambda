#!/bin/bash

# installing AWS CLI
apt-get install -qqy nodejs npm python-pip && pip install awscli

VERSION=$( node -pe "require('./package.json').version")
ACCOUNT_ID=${ACCOUNT_ID}
APPLICATION="UvaSoftware-Scanii-Lambda"

# building
make build package

aws serverlessrepo create-application-version \
 --application-id arn:aws:serverlessrepo:us-east-1:${ACCOUNT_ID}:applications/${APPLICATION} \
 --semantic-version ${VERSION} \
 --source-code-url https://github.com/uvasoftware/scanii-lambda/releases/tag/v${VERSION} \
 --template-body file://scanii-lambda.yaml >/dev/null || exit 99

echo "SAM application ${APPLICATION} version ${VERSION} published!"

git config --global user.email "circleci@uvasoftware.com"
git config --global user.name "CircleCI"
git tag -a v${VERSION} -m "Release by CircleCI v${VERSION}"
# git push origin v${VERSION}


# bumping version
npm version patch
VERSION=$( node -pe "require('./package.json').version")
echo "next version is: $VERSION"

#commit version change
git status
git commit -a -m "bump to $VERSION [ci skip]"
# git push origin master
