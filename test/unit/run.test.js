var _ = require('lodash'),
    path = require('path'),
    sdk = require('postman-collection'),
    async = require('async');

/* global describe, it, expect */
describe('run module', function () {
    var run = require('../../lib/run');

    it('should export a function', function () {
        expect(run).to.be.a('function');
    });

    it('should start a run with no options and return error in callback', function (done) {
        expect(function () {
            run(function (err) {
                expect(err).to.be.ok;
                expect(err.message).to.equal('newman: expecting a collection to run');
                done();
            });
        }).to.not.throw();
    });

    it('should error out if collection is absent in options', function (done) {
        expect(function () {
            run({}, function (err) {
                expect(err).be.ok;
                expect(err && err.message).to.equal('newman: expecting a collection to run');

                done();
            });
        }).to.not.throw();
    });

    it('should start a run with empty collection as plain object', function (done) {
        expect(function () {
            run({
                collection: {}
            }, done);
        }).to.not.throw();
    });

    it('should start a run with empty collection as SDK instance', function (done) {
        expect(function () {
            run({
                collection: new sdk.Collection()
            }, done);
        }).to.not.throw();
    });

    it('should provide sdk instances as part of the run', function (done) {
        expect(function () {
            run({
                collection: {}
            }, function (err, newman) {
                if (err) {
                    return done(err);
                }

                expect(newman).to.be.an('object');
                expect(newman).to.have.property('collection');
                expect(newman).to.have.property('environment');
                expect(newman).to.have.property('globals');

                expect(newman.collection,
                    'should be an instance of PostmanCollection').to.be.an.instanceof(sdk.Collection);
                expect(newman.environment,
                    'should be an instance of PostmanVariableScope').to.be.an.instanceof(sdk.VariableScope);
                expect(newman.globals,
                    'should be an instance of PostmanVariableScope').to.be.an.instanceof(sdk.VariableScope);

                done();
            });
        }).to.not.throw();
    });

    it('should retain sdk references from options', function (done) {
        var options = {
            collection: new sdk.Collection(),
            environment: new sdk.VariableScope(),
            globals: new sdk.VariableScope()
        };

        expect(function () {
            run(options, function (err, newman) {
                if (err) {
                    return done(err);
                }

                expect(_.omit(newman.collection.toJSON(), '_')).to.eql(options.collection.toJSON());
                expect(newman.environment).to.eql(options.environment);
                expect(newman.globals).to.eql(options.globals);

                done();
            });
        }).to.not.throw();
    });

    it('should gracefully send error to callback on garbage collection', function (done) {
        async.parallel([
            function (next) {
                expect(function () {
                    run({
                        collection: null
                    }, function (err) {
                        expect(err).be.ok;
                        expect(err && err.message).to.equal('newman: expecting a collection to run');
                        next();
                    });
                }).to.not.throw();
            },
            function (next) {
                expect(function () {
                    run({
                        collection: 3.14
                    }, function (err) {
                        expect(err).be.ok;
                        expect(err && err.message).to.equal('newman: collection could not be loaded');
                        next();
                    });
                }).to.not.throw();
            },
            function (next) {
                expect(function () {
                    run({
                        collection: 'abcd'
                    }, function (err) {
                        expect(err).be.ok;
                        expect(err && err.help).to.equal('unable to read data from file "abcd"');
                        next();
                    });
                }).to.not.throw();
            }
        ], done);
    });

    // @todo: run tests with exec and nock instead
    it('should correctly resolve conflicts between iterationData.length and iterationCount', function (done) {
        this.timeout(10000); // set 10s timeout

        var testData = path.join(__dirname, '..', 'fixtures', 'run', 'test-data.postman_data.json'),
            testCollection = path.join(__dirname, '..', 'fixtures', 'run', 'single-get-request.json');

        async.parallel([
            // collection run with neither iterationData, nor iterationCount specified
            function (next) {
                expect(function () {
                    run({
                        collection: testCollection
                    }, function (err, summary) {
                        expect(err).to.be.null;
                        expect(summary.run.stats.iterations.total).to.equal(1);
                        next();
                    });
                }).to.not.throw();
            },
            // collection run with iterationData, but no iterationCount specified
            function (next) {
                expect(function () {
                    run({
                        collection: testCollection,
                        iterationData: testData
                    }, function (err, summary) {
                        expect(err).to.be.null;
                        expect(summary.run.stats.iterations.total).to.equal(2);
                        next();
                    });
                }).to.not.throw();
            },
            // collection run with iterationCount, but no iterationData specified
            function (next) {
                expect(function () {
                    run({
                        collection: testCollection,
                        iterationCount: 2
                    }, function (err, summary) {
                        expect(err).to.be.null;
                        expect(summary.run.stats.iterations.total).to.equal(2);
                        next();
                    });
                }).to.not.throw();
            },
            // collection run with both iterationData and iterationCount specified
            function (next) {
                expect(function () {
                    run({
                        collection: testCollection,
                        iterationData: testData,
                        iterationCount: 3
                    }, function (err, summary) {
                        expect(err).to.be.null;
                        expect(summary.run.stats.iterations.total).to.equal(3);
                        next();
                    });
                }).to.not.throw();
            }
        ], done);
    });
});
