describe('Postman reporter', function () {
    it('should print info message if collection is not specified as postman API URL', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/newman-report-test.json -r postman',
            function (code, stdout, stderr) {
                expect(code).be.ok;
                expect(stderr).to.be.empty;
                expect(stdout).to.contain('Publishing run details to postman cloud is currently supported ' +
                    'only for collections specified via postman API link.');
                expect(stdout).to.contain('Refer: ' +
                    'https://github.com/postmanlabs/newman#using-newman-with-the-postman-api');

                done();
            });
    });
});

