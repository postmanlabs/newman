var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('json5'),
	path   = require('path');

var TestResponseHandler = require('../src/responseHandlers/TestResponseHandler');

describe("TestResponseHandler", function() {

	beforeEach(function() {
		var filePath = path.join(__dirname, 'data', 'PostmanCollection.json');
		this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
		this.request = this.collectionJson.requests[0];
		this.response = {
			headers: {
				'server': 'nginx/1.1.19',
				'content-type': 'application/json',
				'content-length': '3',
				'connection': 'Keep-Alive',
				'age': '286'
			},
			stats: {timeTaken: 100},
			statusCode: 200,
			body: "{\"lol\": \"jhingalalal\"}"
		};
		this.stub = sinon.stub(TestResponseHandler, '_logTestResults');
	});
	
	it("should run the test cases properly", function() {
		this.request.tests = 'tests["statuscode is 200"] = responseCode.code === 200;\n\ntests["Content type is correct"] = responseHeaders["content-type"].has("application/json")';
		var parsedResult = {"statuscode is 200": true,"Content type is correct": true};
		TestResponseHandler._runAndLogTestCases(null, this.response, this.response.body, this.request);
		assert(TestResponseHandler._logTestResults.calledWith(parsedResult));
	});

	afterEach(function() {
		TestResponseHandler._logTestResults.restore();
	});
});