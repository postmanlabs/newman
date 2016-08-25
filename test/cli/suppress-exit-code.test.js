/* global describe, it, exec, expect */
describe('--suppress-exit-code', function () {
    this.timeout(1000 * 60); // set 60s timeout

    it('`newman run` must accept the --suppress-exit-code parameter', function (done) {
        exec('./bin/newman.js run test/cli/single-get-request.json --suppress-exit-code', function (code) {
            expect(code).be(0);
            done();
        });
    });

    it('`newman run` must accept the -x parameter', function (done) {
        exec('./bin/newman.js run test/cli/single-get-request.json -x', function (code) {
            expect(code).be(0);
            done();
        });
    });

    it('`newman run` exit non-zero if -x parameter is absent on a failing collection', function (done) {
        exec('./bin/newman.js run test/cli/single-request-failing.json', function (code) {
            expect(code).be.greaterThan(0);
            done();
        });
    });

    it('`newman run` exit with code zero if -x parameter is present on a failing collection', function (done) {
        exec('./bin/newman.js run test/cli/single-request-failing.json -x', function (code) {
            expect(code).be(0);
            done();
        });
    });
});
