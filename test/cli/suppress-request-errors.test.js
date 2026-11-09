describe('newman run --suppress-request-errors', function () {
    it('should accept the --suppress-request-errors parameter', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --suppress-request-errors "123.random.z,123.random.x"', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    // eslint-disable-next-line max-len
    it('should exit non-zero if --suppress-request-errors parameter is absent on a failing collection', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/failed-request.json', function (code) {
            expect(code, 'should have non-zero exit code').to.be.greaterThan(0);
            done();
        });
    });

    // eslint-disable-next-line max-len
    it('should exit with code zero if --suppress-request-errors parameter is present on a failing collection', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/failed-request.json --suppress-request-errors "123.random.z,123.random.x"', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
});
