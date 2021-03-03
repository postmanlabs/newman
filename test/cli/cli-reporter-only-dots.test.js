describe('CLI reporter only dots', function () {
    it('should produce normal output', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-only-dots',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                done(code);
            });
    });
});
