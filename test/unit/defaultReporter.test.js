const sinon = require('sinon'),
    expect = require('chai').expect,
    newman = require('../../');

describe('Default reporter', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());

        // stub the sinks reporters print through, rather than `silent: true`, which would skip registering the
        // reporter's event listeners altogether and drop this suite's coverage of them
        sinon.replace(process.stdout, 'write', sinon.fake());
        sinon.replace(process.stderr, 'write', sinon.fake());
        sinon.replace(console, 'info', sinon.fake());
    });

    afterEach(function () {
        sinon.restore();
    });

    it('cli can be loaded', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['cli']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('json can be loaded', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['json']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('junit can be loaded', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['junit']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('progress can be loaded', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['progress']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('emojitrain can be loaded', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['emojitrain']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });
});
