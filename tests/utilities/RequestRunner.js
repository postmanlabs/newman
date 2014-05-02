var assert = require('assert'),
	sinon  = require('sinon'),
	RequestModel  = require('../../src/models/RequestModel'),
	RequestRunner  = require('../../src/runners/RequestRunner'),
	Emitter        = require('../../src/utilities/EventEmitter');

describe("Request Runner.", function() {
	beforeEach(function() {
		var emitter = new Emitter();
		this.stub = sinon.stub(RequestRunner, '_sendRequestAndGenerateReponse', function(request) {
			emitter.emit('requestExecuted', false, true, '', request);
		});
	});

	it("should should execute a request.", function() {
		var request1 = {
			"id": "155decc9-7d1d-b502-46a4-729cc4ced402",
			"headers": "",
			"url": "http://dump.getpostman.com/status",
			"pathVariables": {},
			"method": "GET",
			"data": [],
			"dataMode": "params",
			"version": 2,
			"tests": "",
			"time": 1396961100005,
			"name": "Status",
			"description": "Return the status of the API with the timestamp.",
			"collectionId": "f5544ddb-8162-49d7-bf8a-ede07747253a",
			"responses": [],
			"synced": false
		};
		RequestRunner.addRequest(new RequestModel(request1));
		RequestRunner.start();
		assert(this.stub.called);
	});

	it("should should execute multiple requests.", function() {
		var request1 = {
			"id": "155decc9-7d1d-b502-46a4-729cc4ced402",
			"headers": "",
			"url": "http://dump.getpostman.com/status",
			"pathVariables": {},
			"method": "GET",
			"data": [],
			"dataMode": "params",
			"version": 2,
			"tests": "",
			"time": 1396961100005,
			"name": "Status",
			"description": "Return the status of the API with the timestamp.",
			"collectionId": "f5544ddb-8162-49d7-bf8a-ede07747253a",
			"responses": [],
			"synced": false
		};
		RequestRunner.addRequest(new RequestModel(request1));
		RequestRunner.addRequest(new RequestModel(request1));
		RequestRunner.start();
		assert(this.stub.calledTwice);
	});
	
	afterEach(function() {
		RequestRunner._sendRequestAndGenerateReponse.restore();
		RequestRunner.purgeAllItemsInQueue();
	});
});