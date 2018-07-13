var fs = require('fs'),
    path = require('path'),

    _ = require('lodash');

/* global beforeEach, afterEach, describe, it, expect, newman */
describe('iterationCount vs iterationData.length conflicts', function () {
    var iterationProperty = 'run.stats.iterations.total',
        collectionRunPath = path.join(__dirname, '..', '..', 'out', 'iteration-count-test.json');

    beforeEach(function (done) {
        fs.stat('out', function (err) {
            if (err) { return fs.mkdir('out', done); }

            done();
        });
    });

    afterEach(function (done) {
        fs.stat(collectionRunPath, function (err) {
            if (err) { return done(); }

            fs.unlink(collectionRunPath, done);
        });
    });

    it('should iterate exactly once when no options are specified', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['json'],
            reporter: { json: { export: collectionRunPath } }
        }, function (err) {
            if (err) { return done(err); }

            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(_.get(collectionRun, iterationProperty), 'should have 1 iteration').to.equal(1);
            done();
        });
    });

    it('should iterate according to iterationData.length when specified', function (done) {
        newman.run({
            collection: 'test/integration/steph/steph.postman_collection.json',
            iterationData: 'test/integration/steph/steph.postman_data.json',
            reporters: ['json'],
            reporter: { json: { export: collectionRunPath } }
        }, function (err) {
            if (err) { return done(err); }

            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(_.get(collectionRun, iterationProperty), 'should have 2 iterations').to.equal(2);
            done();
        });
    });

    it('should iterate according to iterationCount when specified', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            iterationCount: 3,
            reporters: ['json'],
            reporter: { json: { export: collectionRunPath } }
        }, function (err) {
            if (err) { return done(err); }

            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(_.get(collectionRun, iterationProperty), 'should have 3 iterations').to.equal(3);
            done();
        });
    });

    it('should iterate according to iterationCount when BOTH options are specified', function (done) {
        newman.run({
            collection: 'test/integration/steph/steph.postman_collection.json',
            iterationCount: 3,
            iterationData: 'test/integration/steph/steph.postman_data.json',
            reporters: ['json'],
            reporter: { json: { export: collectionRunPath } }
        }, function (err) {
            if (err) { return done(err); }

            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(_.get(collectionRun, iterationProperty), 'should have 3 iteration').to.equal(3);
            done();
        });
    });
});
