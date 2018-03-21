var _ = require('lodash'),
    path = require('path'),
    expect = require('expect.js'),
    sdk = require('postman-collection'),
    async = require('async');

/* global describe, it */
describe('run module', function () {
    var run = require('../../lib/run');

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

    it('must provide sdk instances as part of the run', function (done) {
        expect(run).withArgs({ collection: {} }, function (err, newman) {
            if (err) {
                return done(err);
            }

            expect(newman).be.an('object');
            expect(newman).have.property('collection');
            expect(newman).have.property('environment');
            expect(newman).have.property('globals');

            expect(newman.collection).be.a(sdk.Collection);
            expect(newman.environment).be.a(sdk.VariableScope);
            expect(newman.globals).be.a(sdk.VariableScope);

            done();
        }).not.throwException();
    });

    it('must retain sdk references from options', function (done) {
        var options = {
            collection: new sdk.Collection(),
            environment: new sdk.VariableScope(),
            globals: new sdk.VariableScope()
        };

        expect(run).withArgs(options, function (err, newman) {
            if (err) {
                return done(err);
            }

            expect(_.omit(newman.collection.toJSON(), '_')).eql(options.collection.toJSON());
            expect(newman.environment).eql(options.environment);
            expect(newman.globals).eql(options.globals);

            done();
        }).not.throwException();
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

    // @todo: run tests with exec and nock instead
    it('must correctly resolve conflicts between iterationData.length and iterationCount', function (done) {
        this.timeout(10000); // set 10s timeout

        var testData = path.join(__dirname, '..', 'fixtures', 'run', 'test-data.postman_data.json'),
            testCollection = path.join(__dirname, '..', 'fixtures', 'run', 'single-get-request.json');

        async.parallel([
            // collection run with neither iterationData, nor iterationCount specified
            function (next) {
                expect(run).withArgs({
                    collection: testCollection
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.stats.iterations.total).be(1);
                    next();
                }).not.throwException();
            },
            // collection run with iterationData, but no iterationCount specified
            function (next) {
                expect(run).withArgs({
                    collection: testCollection,
                    iterationData: testData
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.stats.iterations.total).be(2);
                    next();
                }).not.throwException();
            },
            // collection run with iterationCount, but no iterationData specified
            function (next) {
                expect(run).withArgs({
                    collection: testCollection,
                    iterationCount: 2
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.stats.iterations.total).be(2);
                    next();
                }).not.throwException();
            },
            // collection run with both iterationData and iterationCount specified
            function (next) {
                expect(run).withArgs({
                    collection: testCollection,
                    iterationData: testData,
                    iterationCount: 3
                }, function (err, summary) {
                    expect(err).be(null);
                    expect(summary.run.stats.iterations.total).be(3);
                    next();
                }).not.throwException();
            }
        ], done);
    });
});
