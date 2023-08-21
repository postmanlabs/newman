const sinon = require('sinon'),
    expect = require('chai').expect,
    { run } = require('../../lib/commands/run/collection-runner');

describe('External reporter', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());
    });

    afterEach(function () {
        sinon.restore();
    });

    it('warns when not found', function (done) {
        run({
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
