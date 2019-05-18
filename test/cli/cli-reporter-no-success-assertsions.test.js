describe('CLI reporter no success assertions', function () {
    var noSuccessOutput = /response\s+code\s+is\s+200/;

    it('should produce normal output', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(noSuccessOutput);

                done(code);
            });
    });

    it('should not contain success output', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-no-success-assertions',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.not.match(noSuccessOutput);

                done(code);
            });
    });
});
