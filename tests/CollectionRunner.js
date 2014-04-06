var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('json5'),
	path   = require('path'),
	_und   = require('underscore');

// importing newman modules
var Newman            = require('../src/Newman.js'),
	CollectionModel   = require('../src/models/CollectionModel.js'),
	CollectionRunner  = require('../src/runners/CollectionRunner.js'),
	RequestRunner     = require('../src/runners/RequestRunner.js'),
	VariableProcessor = require('../src/utilities/VariableProcessor.js');

describe("CollectionRunner", function() {

	beforeEach(function() {
		var filePath = path.join(__dirname, 'data', 'PostmanCollection.json');
		var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
		this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
		this.stub = sinon.stub(RequestRunner, 'addRequest');
	});
	
	it("should call requestRunner addRequest for each request", function() {
		Newman.execute(this.collectionJson, {});
		assert.equal(this.stub.callCount, this.collectionJson.requests.length);
	});

	afterEach(function() {
		RequestRunner.addRequest.restore();
	});
});
