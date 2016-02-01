var assert = require('assert'),
    sinon = require('sinon'),
    fs = require('fs'),
    JSON5 = require('json5'),
    path = require('path'),
    _und = require('underscore');

// importing newman modules
var Newman = require('../../src/Newman.js'),
    CollectionModel = require('../../src/models/CollectionModel'),
    CollectionRunner = require('../../src/runners/CollectionRunner'),
    IterationRunner = require('../../src/runners/IterationRunner'),
    RequestRunner = require('../../src/runners/RequestRunner'),
    Emitter = require('../../src/utilities/EventEmitter'),
    VariableProcessor = require('../../src/utilities/VariableProcessor');

describe("IterationRunner", function () {

    beforeEach(function () {
        var filePath = path.join(__dirname, '../', 'data', 'PostmanCollection.json');
        var url = "https://www.getpostman.com/collections/fc3f0598daaa5271e4f7";
        var options = { iterationCount: 2 };
        var emitter = new Emitter();
        var collectionJson = JSON5.parse(fs.readFileSync(filePath, 'utf8'));
        emitter.removeAllListeners();
        this.iterationRunner = new IterationRunner(collectionJson, options);
        sinon.stub(this.iterationRunner, '_logStatus');
        sinon.stub(this.iterationRunner, '_runCollection', function () {
            emitter.emit('collectionRunnerOver');
        });
    });

    it("should call nextIteration for every itertion", function () {
        this.iterationRunner.execute();
        assert(this.iterationRunner.iteration, 2);
    });

    afterEach(function () {
        this.iterationRunner._logStatus.restore();
        this.iterationRunner._runCollection.restore();
    });
});
