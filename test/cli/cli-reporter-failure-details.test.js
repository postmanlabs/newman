describe('CLI reporter failure details', function () {
    it('should correctly show complete details for the failure list', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-request-failing.json --reporter-cli-no-assertion --reporter-cli-no-summary', function (code, stdout, stderr) {
            expect(code).be.ok;
            expect(stderr).to.be.empty;
            expect(stdout).to.contain('1.  AssertionError  response code is 200');
            expect(stdout).to.contain('expected false to be truthy');
            expect(stdout).to.contain('at assertion:0 in test-script');
            expect(stdout).to.contain('inside "Status Code Test"');

            done();
        });
    });
});
