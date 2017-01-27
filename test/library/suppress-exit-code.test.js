/* global describe, it, expect, newman */
describe('--suppress-exit-code', function () {
    it('`newman run` must accept the --suppress-exit-code parameter', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            suppressExitCode: true
        }, done);
    });

    it('`newman run` exit non-zero if -x parameter is absent on a failing collection', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json'
        }, function (err, summary) {
            expect(err).to.be(null);
            expect(summary.run.failures).to.have.length(1);
            done();
        });
    });

    it('`newman run` exit with code zero if -x parameter is present on a failing collection', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            suppressExitCode: true
        }, done);
    });
});
