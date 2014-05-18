var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	_und   = require('underscore'),
	JSON5  = require('json5'),
	path   = require('path');

var TestResponseHandler = require('../../src/responseHandlers/TestResponseHandler'),
	Logger              = require('../../src/utilities/Logger'),
	ErrorHandler        = require('../../src/utilities/ErrorHandler'),
	Globals             = require('../../src/utilities/Globals'),
	Helpers             = require('../../src/utilities/Helpers');

describe("TestResponseHandler", function() {

	beforeEach(function() {
		var filePath = path.join(__dirname, '../', 'data', 'PostmanCollection.json');
		this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
		this.request = this.collectionJson.requests[0];
		this.request.headers = "Accept-Language: En\nCache-Control: 123\nPragma: Akamai";
        this.request.dataMode = "params";
        this.request.data = [ 
            { "key": "name", "value": "alice", "type": "text" }, 
            { "key": "age", "value": "40", "type": "text" }];
		this.request.transformed = {
			url: this.request.url,
			headers: this.request.headers,
			data: this.request.data,
		};
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
		this.loggerStub = sinon.stub(ErrorHandler, 'exceptionError');
		Globals.envJson = { values: [] };
	});
	
	it("should run the test cases properly", function() {
		this.request.tests = 'tests["statuscode is 200"] = responseCode.code === 200;\n\ntests["Content type is correct"] = responseHeaders["content-type"].has("application/json")';
		var parsedResult = {"statuscode is 200": true,"Content type is correct": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should run the test cases with the sugar has properly", function() {
		this.request.tests = 'tests["testcase1"] = "Sugar has me".has("Sugar")';
		var parsedResult = {"testcase1": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should run the test cases with the tv4 validator properly", function() {
		this.request.tests = 'tests["testcase1"] = tv4.validate({"message": "This is a message."}, {"message": "string"})';
		var parsedResult = {"testcase1": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should run the test cases with the lodash properly", function() {
		this.request.tests = 'tests["testcase1"] = _.isString(responseBody)';
		var parsedResult = {"testcase1": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should run the test cases with the Backbone properly", function() {
		this.request.tests = 'tests["testcase1"] = new Backbone.Model({a: "b"}).toJSON().a === "b"';
		var parsedResult = {"testcase1": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should run the test cases with the xmlToJson properly", function() {
		this.request.tests = 'tests["testcase1"] = xmlToJson("<a><b>Success</b></a>").a.b === "Success"';
		var parsedResult = {"testcase1": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should run the test cases with the Jquery properly", function() {
		this.request.tests = 'tests["testcase1"] = $.isArray([])';
		var parsedResult = {"testcase1": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should catch exception for invalid code / test cases", function() {
		this.request.tests = 'tests["throws exception"] = undefinedValue === 200;'; // this should throw an exception
		TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert(this.loggerStub.called);
	});

	it("should run test cases on request object properly", function() {
		this.request.tests = '';
		this.request.tests += 'tests["testcase1"] = request.url === "' + this.request.url + '";';
		this.request.tests += 'tests["testcase2"] = _.has(request.headers, "Cache-Control") === true;';
		this.request.tests += 'tests["testcase3"] = request.dataMode === "params";';
		this.request.tests += 'tests["testcase4"] = request.data.name === "alice";';
		this.request.tests += 'tests["testcase5"] = request.data.age == 40;';
		var parsedResult = {"testcase1": true, "testcase2": true, "testcase3": true, "testcase4": true, "testcase5": true};
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, parsedResult);
	});

	it("should get env variable properly", function() {
		Globals.envJson = {
			values: [
				{
					"key": "url",
					"value": "http://dump.getpostman.com",
					"type": "text",
					"name": "url"
				},
				{
					"key": "user_id",
					"value": "1",
					"type": "text",
					"name": "user_id"
				}
			]
		};
		this.request.tests = '';
		this.request.tests += 'tests["testcase1"] = environment.url === "http://dump.getpostman.com";';
		this.request.tests += 'tests["testcase2"] = environment["user_id"] == 1;';
		var expectedResult = {"testcase1": true, "testcase2": true };
		var results = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert.deepEqual(results, expectedResult);
	});

	it("should set env variable properly", function() {
		Globals.envJson = {
			values: [
				{
					"key": "url",
					"value": "http://dump.getpostman.com",
					"type": "text",
					"name": "url"
				},
				{
					"key": "user_id",
					"value": "1",
					"type": "text",
					"name": "user_id"
				}
			]
		};
		this.request.tests = 'postman.setEnvironmentVariable("url", "google.com"); postman.setEnvironmentVariable("id", "10");';
		var tests = TestResponseHandler._runTestCases(null, this.response, this.response.body, this.request);
		assert(_und.contains(_und.pluck(Globals.envJson.values, 'key'), 'id'));
		assert(_und.contains(_und.pluck(Globals.envJson.values, 'key'), 'url'));
		assert(_und.contains(_und.pluck(Globals.envJson.values, 'value'), 'google.com'));
		assert(_und.contains(_und.pluck(Globals.envJson.values, 'value'), '10'));
	});

	afterEach(function() {
		TestResponseHandler._logTestResults.restore();
		ErrorHandler.exceptionError.restore();
	});
});
