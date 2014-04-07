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
		this.request = this.collection.requests[0];
	});
	
	it("test", function() {
		console.log(this.collectionJson.requests[0]);
	});
});
