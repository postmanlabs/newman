var sinon = require('sinon'),
    newman = require('../../');

describe('External reporter', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());
    });

    afterEach(function () {
        sinon.restore();
    });

    it('warns when not found', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['unknownreporter']
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.true;
            expect(console.warn.calledWith('newman: could not find "unknownreporter" reporter')).to.be.true;

            done();
        });
    });

    it('warns when not found for newman request', function (done) {
        newman.request({
            request: 'GET',
            url: 'https://postman-echo.com/get',
            responseLimit: 10485760,
            reporters: ['unknownreporter'],
            singleRequest: true
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.true;
            expect(console.warn.calledWith('newman: could not find "unknownreporter" reporter')).to.be.true;

            done();
        });
    });
});
