describe('newman run --suppress-exit-code', function () {
    it('should accept the --suppress-exit-code parameter', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --suppress-exit-code', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should accept the -x parameter', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -x', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should exit non-zero if -x parameter is absent on a failing collection', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-request-failing.json', function (code) {
            expect(code, 'should have non-zero exit code').to.be.greaterThan(0);
            done();
        });
    });

    it('should exit with code zero if -x parameter is present on a failing collection', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-request-failing.json -x', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
});
