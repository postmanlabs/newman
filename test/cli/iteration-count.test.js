/* global describe, it, exec, expect */
var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),

    ITERATION_PROPERTY = 'run.stats.iterations.total',

    collectionRunPath = path.join(__dirname, '..', '..', 'out', 'iteration-count-test.json');

describe('iterationCount vs iterationData.length conflicts', function () {
    afterEach(function () {
        try { fs.unlinkSync(collectionRunPath); }
        catch (e) { console.error(e); }
    });

    it('should iterate exactly once when no options are specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -r json --reporter-json-export out/iteration-count-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 1 iteration').to.equal(1);
            done();
        });
    });

    it('should iterate according to iterationData.length when specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/steph/steph.postman_collection.json -d test/integration/steph/steph.postman_data.json -r json --reporter-json-export out/iteration-count-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 2 iterations').to.equal(2);
            done();
        });
    });

    it('should iterate according to iterationCount when specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --iteration-count 3 -r json --reporter-json-export out/iteration-count-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 3 iterations').to.equal(3);
            done();
        });
    });

    it('should iterate according to iterationCount when BOTH options are specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/steph/steph.postman_collection.json -d test/integration/steph/steph.postman_data.json --iteration-count 3 -r json --reporter-json-export out/iteration-count-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 3 iterations').to.equal(3);
            done();
        });
    });
});
