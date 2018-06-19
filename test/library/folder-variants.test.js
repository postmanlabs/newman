var fs = require('fs'),
    path = require('path'),

    _ = require('lodash');

/* global beforeEach, afterEach, describe, it, expect, newman */
describe('folder variants', function () {
    var iterationProperty = 'run.stats.iterations.total',
        collectionRunPath = path.join(__dirname, '..', '..', 'out', 'folder-variants-test.json');

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

    it('should run the specified request in case folder name is valid', function (done) {
        newman.run({
            collection: 'test/fixtures/run/named-request.json',
            folder: 'correct_name',
            reporters: ['json'],
            reporter: { json: { export: collectionRunPath } }
        }, function (err) {
            if (err) { return done(err); }

            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(_.get(collectionRun, iterationProperty, 'should have 1 iteration')).to.equal(1);
            done();
        });
    });

    it('should skip the collection run in case folder name is invalid', function (done) {
        newman.run({
            collection: 'test/fixtures/run/named-request.json',
            folder: 'incorrect_name',
            reporters: ['json'],
            reporter: { json: { export: collectionRunPath } }
        }, function (err) {
            if (err) { return done(err); }

            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(_.get(collectionRun, iterationProperty), 'should have 0 iteration').to.equal(0);
            done();
        });
    });

});
