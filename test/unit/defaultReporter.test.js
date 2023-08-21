const sinon = require('sinon'),
    expect = require('chai').expect,
    { run } = require('../../lib/commands/run/collection-runner');

describe('Default reporter', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());
    });

    afterEach(function () {
        sinon.restore();
    });

    it('cli can be loaded', function (done) {
        run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['cli']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('json can be loaded', function (done) {
        run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['json']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('junit can be loaded', function (done) {
        run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['junit']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('progress can be loaded', function (done) {
        run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['progress']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('emojitrain can be loaded', function (done) {
        run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['emojitrain']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });
});
