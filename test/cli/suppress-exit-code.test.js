/* global describe, it, exec, expect */
describe('--suppress-exit-code', function () {
    it('`newman run` must accept the --suppress-exit-code parameter', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --suppress-exit-code', function (code) {
            expect(code).be(0);
            done();
        });
    });

    it('`newman run` must accept the -x parameter', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -x', function (code) {
            expect(code).be(0);
            done();
        });
    });

    it('`newman run` exit non-zero if -x parameter is absent on a failing collection', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-request-failing.json', function (code) {
            expect(code).be.greaterThan(0);
            done();
        });
    });

    it('`newman run` exit with code zero if -x parameter is present on a failing collection', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-request-failing.json -x', function (code) {
            expect(code).be(0);
            done();
        });
    });
});
