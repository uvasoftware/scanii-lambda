build: clean npm-install
	zip -9vr /tmp/scanii-lambda.zip lib/ node_modules/ package* README.md LICENSE
	@echo "#### BUILD COMPLETED ####"
	@echo "bundle => /tmp/scanii-lambda.zip"

package:
	sam validate
	sam package --s3-bucket scanii-assets --s3-prefix sam/scanii-lambda \
	--template-file template.yml --output-template-file scanii-lambda.yaml

npm-install:
	npm install .

test: clean npm-install
	npm test

clean:
	rm -rf /tmp/scanii-lambda.zip
	rm -rf node_modules

run:
	sam local start-api --env-vars environment.json

run-submit-event:
	sam local generate-event s3 put | sam local invoke ScaniiSubmitFn
