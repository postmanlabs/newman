var sinon = require('sinon'),
    newman = require('../../');

describe('Proxy Authentication', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());
    });

    afterEach(function () {
        sinon.restore();
    });

    it('should work properly without proxy(no proxy env)', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json'
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });

    it('should work properly without proxy(proxy env)', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            proxy: 'test:test'
        }, function (err) {
            expect(err).to.be.null;
            expect(console.warn.called).to.be.false;

            done();
        });
    });
});
