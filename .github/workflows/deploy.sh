#!/bin/bash -x

export LC_ALL=C.UTF-8 # needed by SAM
export LANG=C.UTF-8 # needed by SAM
export AWS_DEFAULT_REGION=us-east-1 # needed by SAM
export APPLICATION="UvaSoftware-Scanii-Lambda"
export ACCOUNT_ID=${AWS_ACCOUNT_ID}
export SAM_CLI_TELEMETRY=0

VERSION=$( node -pe "require('./package.json').version")

# building
make build package || exit 100

aws serverlessrepo create-application-version \
 --application-id arn:aws:serverlessrepo:us-east-1:"${ACCOUNT_ID}":applications/${APPLICATION} \
 --semantic-version "${VERSION}" \
 --source-code-url https://github.com/uvasoftware/scanii-lambda/releases/tag/v"${VERSION}" \
 --template-body file://scanii-lambda.yaml >/dev/null || exit 99

echo "SAM application ${APPLICATION} version ${VERSION} published!"

# tag repo
git config --global user.email "ci@uvasoftware.com"
git config --global user.name "Github Actions"
git tag -a v"${VERSION}" -m "Release by Github Actions v${VERSION}"
git push origin v"${VERSION}"

# bumping version
npm --no-git-tag-version version minor
VERSION=$( node -pe "require('./package.json').version")
echo "next version is: $VERSION"

#commit version change
git commit -a -m "bump to $VERSION [ci skip]"
git push origin main
