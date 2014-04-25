var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('json5'),
	path   = require('path'),
	_und   = require('underscore');

// importing newman modules
var Newman            = require('../../src/Newman.js'),
	CollectionModel   = require('../../src/models/CollectionModel'),
	CollectionRunner  = require('../../src/runners/CollectionRunner'),
	IterationRunner   = require('../../src/runners/IterationRunner'),
	RequestRunner     = require('../../src/runners/RequestRunner'),
	Emitter           = require('../../src/utilities/EventEmitter'),
	VariableProcessor = require('../../src/utilities/VariableProcessor');

describe("IterationRunner", function() {

	beforeEach(function() {
		var filePath = path.join(__dirname, '../', 'data', 'PostmanCollection.json');
		var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
		var options = {iterationCount: 2};
		this.emitter = new Emitter();
		this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));

		this.emitter.removeAllListeners();

		this.iterationRunner = new IterationRunner(this.collectionJson, options);
		this.spy = sinon.spy(this.iterationRunner, '_runNextIteration');

		sinon.stub(RequestRunner, '_execute');
	});

	it("should call nextIteration for every itertion", function() {
		this.iterationRunner._runCollection = function() {
			//this.emitter.emit('collectionRunnerOver');
		}.bind(this);

		//this.iterationRunner.execute();
	});

	afterEach(function() {
		this.iterationRunner._runNextIteration.restore();
	});
});
