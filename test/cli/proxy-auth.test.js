
describe('CLI proxy options', function () {
    it('should run correctly if no proxy option is provided', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
    it('should give error if credentials provided without url', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-credentials test:test', function (code, stdout, stderr) {
            expect(code).to.equal(1);
            expect(stderr).to.be.ok;
            done();
        });
    });
    it('should give error if url provided without credentials', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-url ip:port', function (code, stdout, stderr) {
            expect(code).to.equal(1);
            expect(stderr).to.be.ok;
            done();
        });
    });
    it('should run correctly if credentials and url are provided properly', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-url ip:port --proxy-credentials test:test',
            function (code, stdout) {
                expect(code).to.equal(1);
                expect(stdout).to.include('Sample Postman Collection');
                done();
            });
    });
});
