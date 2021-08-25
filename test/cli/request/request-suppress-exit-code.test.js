describe('newman request --suppress-exit-code', function () {
    it('should accept the --suppress-exit-code parameter', function (done) {
        exec('node ./bin/newman.js request -X WRONG_METHOD https://postman-echo.com/get --suppress-exit-code',
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(0);
                done();
            });
    });

    it('should accept the -x parameter', function (done) {
        exec('node ./bin/newman.js request -X WRONG_METHOD https://postman-echo.com/get -x', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should exit non-zero if -x parameter is absent on a wrong http method', function (done) {
        exec('node ./bin/newman.js request -X WRONG_METHOD https://postman-echo.com/get', function (code) {
            expect(code, 'should have non-zero exit code').to.be.greaterThan(0);
            done();
        });
    });

    it('should exit with code zero if -x parameter is present on a failing url', function (done) {
        exec('node ./bin/newman.js request -X WRONG_METHOD https://postman-echo.com/get -x', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
});
