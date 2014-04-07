var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('json5'),
	path   = require('path'),
	_und   = require('underscore');

var TestResponseHandler = require('../src/responseHandlers/TestResponseHandler');

describe("ResponseHandlerFactory", function() {

	beforeEach(function() {
		var filePath = path.join(__dirname, 'data', 'PostmanCollection.json');
		var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
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
			stats: {timeTaken: "100"},
			statusCode: 200,
		};
	});
	
	it("should return false for request for no test cases", function() {
		this.request.tests = 'tests["statuscode is 200"] = responseCode === 200;' + 
							'\n\ntests["response has content-type"] = responseHeaders["content-type"] == "application/json";';
		TestResponseHandler.execute(this.request, this.response);
	});
});
