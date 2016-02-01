var assert = require('assert'),
    sinon = require('sinon'),
    fs = require('fs'),
    JSON5 = require('json5'),
    path = require('path'),
    _und = require('underscore');

// importing newman modules
var Newman = require('../../src/Newman.js'),
    CollectionModel = require('../../src/models/CollectionModel.js'),
    CollectionRunner = require('../../src/runners/CollectionRunner.js'),
    RequestRunner = require('../../src/runners/RequestRunner.js'),
    Emitter = require('../../src/utilities/EventEmitter'),
    VariableProcessor = require('../../src/utilities/VariableProcessor.js');

describe("CollectionRunner", function () {

    beforeEach(function () {
        var filePath = path.join(__dirname, '../', 'data', 'PostmanCollection.json');
        var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
        var options = {};
        this.emitter = new Emitter();
        this.collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));

        var collectionModel = new CollectionModel(this.collectionJson);
        var marshalledCollection = collectionModel.getOrderedRequests(options);

        this.stub = sinon.stub(RequestRunner, 'addRequest');
        sinon.stub(RequestRunner, '_execute');
        this.collectionRunner = new CollectionRunner(marshalledCollection, options);

    });

    it("should call requestRunner addRequest for each request", function () {
        this.collectionRunner.execute();
        assert.equal(this.stub.callCount, this.collectionJson.requests.length);
    });

    afterEach(function () {
        RequestRunner.addRequest.restore();
        RequestRunner._execute.restore();
    });
});
