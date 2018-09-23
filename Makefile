package: build
	sam package --s3-bucket scanii-assets --s3-prefix sam/scanii-lambda \
	--template-file template.yml --output-template-file scanii-lambda.yaml
	aws cloudformation validate-template --template-body file://scanii-lambda.yaml

npm-install:
	npm install .

test: npm-install
	npm test

build: clean test
	zip -9vr /tmp/scanii-lambda.zip lib/ node_modules/ package* README.md LICENSE
	@echo "#### BUILD COMPLETED ####"
	@echo "bundle => /tmp/scanii-lambda.zip"

clean:
	rm -rf /tmp/scanii-lambda.zip
	rm -rf node_modules
