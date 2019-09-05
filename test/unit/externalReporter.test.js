var sinon = require('sinon'),
    newman = require('../../');

describe('External reporter', function () {
    afterEach(function () {
        sinon.restore();
    });

    it('warns when not found', function (done) {
        sinon.replace(console, 'warn', sinon.fake());

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
});
