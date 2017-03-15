/* globals it, describe, exec */
describe('CLI run options', function () {
    it('should work correctly without any extra options', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json', done);
    });

    it('should not work without a collection', function (done) {
        exec('node ./bin/newman.js run -e test/fixtures/run/simple-variables.json',
        function (code) {
            expect(code).be(1);
            done();
        });
    });

    it('should not work without any options', function (done) {
        exec('node ./bin/newman.js run', function (code) {
            expect(code).be(1);
            done();
        });
    });

    it('should fail a collection run with undefined test cases', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/undefined-test-checks.json', function (code) {
            expect(code).be(1);
            done();
        });
    });
});
