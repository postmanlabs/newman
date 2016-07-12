var expect = require('expect.js'),
    sdk = require('postman-collection');

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

    it('must start a run with empty collection object', function (done) {
        expect(run).withArgs({
            collection: new sdk.Collection()
        }, done).not.throwException();
    });
});
