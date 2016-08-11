var path = require('path'),
    async = require('async'),
    expect = require('expect.js'),
    sdk = require('postman-collection');

/* global describe, it */
describe('run module', function () {
    var run = require(path.join(__dirname, '..', '..', 'lib', 'run'));

    it('must export a function', function () {
        expect(run).be.a('function');
    });

    it('must start a run with no options and return error in callback', function (done) {
        expect(run).withArgs(function (err) {
            expect(err).be.ok();
            expect(err.message).be('newman: expecting a collection to run');
            done();
        }).not.throwException();
    });

    it('must error out if collection is absent in options', function (done) {
        expect(run).withArgs({}, function (err) {
            expect(err).be.ok();
            expect(err && err.message).be('newman: expecting a collection to run');

            done();
        }).not.throwException();
    });

    it('must start a run with empty collection as plain object', function (done) {
        expect(run).withArgs({
            collection: {}
        }, done).not.throwException();
    });

    it('must start a run with empty collection as SDK instance', function (done) {
        expect(run).withArgs({
            collection: new sdk.Collection()
        }, done).not.throwException();
    });

    it('must gracefully send error to callback on garbage collection', function (done) {
        async.parallel([
            function (next) {
                expect(run).withArgs({
                    collection: null
                }, function (err) {
                    expect(err).be.ok();
                    expect(err && err.message).be('newman: expecting a collection to run');
                    next();
                }).not.throwException();
            },
            function (next) {
                expect(run).withArgs({
                    collection: 3.14
                }, function (err) {
                    expect(err).be.ok();
                    expect(err && err.message).be('newman: collection could not be loaded');
                    next();
                }).not.throwException();
            },
            function (next) {
                expect(run).withArgs({
                    collection: 'abcd'
                }, function (err) {
                    expect(err).be.ok();
                    expect(err && err.help).be('unable to read data from file "abcd"');
                    next();
                }).not.throwException();
            }
        ], done);
    });

    it('exits with code 0 for all 4 --bail, -x combinations (angel-collection)', function (done) {
        var sampleCollection = path.join(__dirname, '..', '..', 'examples', 'angel.postman_collection.json');

        async.parallel([
            // run with neither bail nor suppressExitCode
            function (next) {
                expect(run).withArgs({
                    collection: sampleCollection
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(0);
                    next();
                }).not.throwException();
            },
            // run with bail, but not suppressExitCode
            function (next) {
                expect(run).withArgs({
                    collection: sampleCollection,
                    bail: true
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(0);
                    next();
                }).not.throwException();
            },
            // run with suppressExitCode, but not bail
            function (next) {
                expect(run).withArgs({
                    collection: sampleCollection,
                    suppressExitCode: true
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(0);
                    next();
                }).not.throwException();
            },
            // run with both bail and suppressExitCode
            function (next) {
                expect(run).withArgs({
                    collection: sampleCollection,
                    bail: true,
                    suppressExitCode: true
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(0);
                    next();
                }).not.throwException();
            }
        ], done);
    });

    it('exits with a correct exit code for all 4 --bail, -x combinations (devil-collection)', function (done) {
        var badCollection = path.join(__dirname, '..', '..', 'examples', 'devil.postman_collection.json');

        async.parallel([
            // run with neither bail nor suppressExitCode
            function (next) {
                expect(run).withArgs({
                    collection: badCollection
                }, function (err, summary) {
                    expect(err).not.be.ok();
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(1);
                    next();
                }).not.throwException();
            },
            // run with bail, but not suppressExitCode
            function (next) {
                expect(run).withArgs({
                    collection: badCollection,
                    bail: true
                }, function (err, summary) {
                    expect(err).not.be.ok();
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(2);
                    next();
                }).not.throwException();
            },
            // run with suppressExitCode, but not bail
            function (next) {
                expect(run).withArgs({
                    collection: badCollection,
                    suppressExitCode: true
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(1);
                    next();
                }).not.throwException();
            },
            // run with both bail and suppressExitCode
            function (next) {
                expect(run).withArgs({
                    collection: badCollection,
                    bail: true,
                    suppressExitCode: true
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.error).be(null);
                    expect(summary.run.failures.length).to.be(2);
                    next();
                }).not.throwException();
            }
        ], done);
    });
});
