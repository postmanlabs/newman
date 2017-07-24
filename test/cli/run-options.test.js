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

    it('should handle invalid collection URLs correctly', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run https://api.getpostman.com/collections/my-collection-uuid?apikey=my-secret-api-key', function (code) {
            expect(code).be(1);
            done();
        });
    });

    it('should correctly work with global variable overrides passed with --global-var', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/steph/steph.postman_collection.json --global-var first=James --global-var last=Bond', function (code) {
            expect(code).be(0);
            done();
        });
    });
});
