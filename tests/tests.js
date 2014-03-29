// Set of prilimnary tests for newman
var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('JSON5');

// importing newman modules
var Newman           = require('../src/Newman.js'),
	CollectionModel  = require('../src/models/CollectionModel.js'),
	CollectionRunner = require('../src/runners/CollectionRunner.js');

describe("Newman", function() {

	beforeEach(function(){
		var filePath = "PostmanCollection.json";
		var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
        this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
		this.collection = new CollectionModel(this.collectionJson);
	});
	
	it("should fetch the collection", function() {
		assert.equal(this.collectionJson.name, "Postman Demo Server");
	});

	it("should make Collection object correctly", function() {
		assert.equal(this.collection.name, this.collectionJson.name);
		assert.equal(this.collection.requests.length, this.collectionJson.requests.length);
	});

	it("should form correct request and folder models", function() {
		var request = this.collection.requests[0];
		var folder = this.collection.folders[0];
		assert.equal("function", typeof request.toString);
		assert.equal("function", typeof folder.toString);
	});

	it("should return marshalled collection", function() {
		var marshalledCollection = this.collection.getOrderedRequests();
		var runner = new CollectionRunner(marshalledCollection);
		assert.equal(marshalledCollection.length, this.collection.requests.length);
	});
});
