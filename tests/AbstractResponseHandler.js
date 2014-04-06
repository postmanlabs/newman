var assert = require('assert'),
	sinon  = require('sinon'),
	fs     = require('fs'),
	JSON5  = require('json5'),
	path   = require('path'),
	_und   = require('underscore');

var Newman            = require('../src/Newman.js'),
	RequestRunner     = require('../src/runners/RequestRunner.js'),
	AbstractResponseHandler = require('../src/responseHandlers/AbstractResponseHandler.js'),
	Emitter = require('../src/utilities/EventEmitter');

describe("Response Handlers", function() {

	beforeEach(function() {
		this.emitter = new Emitter();
		this.stub = sinon.stub(AbstractResponseHandler, '_onRequestExecuted');
		AbstractResponseHandler.initialize();
	});
	
	it("should have _onRequestExecuted called for each request", function() {
		this.emitter.emit('requestExecuted');
		assert(this.stub.called);
	});

	afterEach(function() {
		AbstractResponseHandler._onRequestExecuted.restore();
	});
});
