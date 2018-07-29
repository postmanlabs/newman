describe('newman.run suppressExitCode', function () {
    it('should accept the suppressExitCode parameter', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            suppressExitCode: true
        }, done);
    });

    it('should fail if suppressExitCode parameter is absent on a failing collection', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures, 'should have 1 failure').to.have.lengthOf(1);
            done();
        });
    });

    it('should not fail if suppressExitCode parameter is present on a failing collection', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            suppressExitCode: true
        }, done);
    });
});
