var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('json5'),
	path   = require('path'),
	_und   = require('underscore');

var ResponseHandlerFactory = require('../src/responseHandlers/ResponseHandlerFactory'),
	DefaultResponseHandler = require('../src/responseHandlers/DefaultResponseHandler'),
	AbstractRequestHandler = require('../src/responseHandlers/AbstractResponseHandler');

describe("ResponseHandlerFactory", function() {

	beforeEach(function() {
		var filePath = path.join(__dirname, 'data', 'PostmanCollection.json');
		var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
		this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
		this.factory = ResponseHandlerFactory;
	});
	
	it("should return DefaultResponseHandler by default", function() {
		var handler = this.factory.createResponseHandler({});
		assert.equal(handler, DefaultResponseHandler);
	});

	it("should return false when passed an non-existent module", function() {
		var handler = this.factory.createResponseHandler({responseHandler: "nonExistentModule"});
		assert(!handler);
	});

	it("should return correct module when passed existing module", function() {
		var handler = this.factory.createResponseHandler({responseHandler: "DefaultResponseHandler.js"});
		assert(handler);
	});

	afterEach(function() {
	});
});
