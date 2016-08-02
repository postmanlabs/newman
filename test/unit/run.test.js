var expect = require('expect.js'),
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
                    expect(err && err.message).be('newman: expecting a collection to run');
                    next();
                }).not.throwException();
            },
            function (next) {
                expect(run).withArgs({
                    collection: null
                }, function (err) {
                    expect(err).be.ok();
                    expect(err && err.message).be('newman: expecting a collection to run');
                    next();
                }).not.throwException();
            }
        ], done);
    });
});
