var sinon = require('sinon'),
    newman = require('../../');

describe('Default reporter', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());
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

    it('cli can be loaded for newman request', function (done) {
        newman.request({
            request: 'GET',
            url: 'https://postman-echo.com/get',
            singleRequest: true,
            reporters: ['cli']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('json can be loaded for newman request', function (done) {
        newman.request({
            request: 'GET',
            url: 'https://postman-echo.com/get',
            singleRequest: true,
            reporters: ['json']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('junit can be loaded for newman request', function (done) {
        newman.request({
            request: 'GET',
            url: 'https://postman-echo.com/get',
            singleRequest: true,
            reporters: ['junit']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('progress can be loaded for newman request', function (done) {
        newman.request({
            request: 'GET',
            url: 'https://postman-echo.com/get',
            singleRequest: true,
            reporters: ['progress']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('emojitrain can be loaded for newman request', function (done) {
        newman.request({
            request: 'GET',
            url: 'https://postman-echo.com/get',
            singleRequest: true,
            reporters: ['emojitrain']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });
});
