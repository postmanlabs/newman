
describe('CLI proxy options', function () {
    it('should run correctly if no proxy option is provided', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
    it('should run correctly if url is provided', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-url 127.0.0.1:1', function (code, stdout, stderr) {
            expect(stderr).not.to.be.ok;
            expect(stdout).to.include('Sample Postman Collection');
            done();
        });
    });
    it('should give error if username provided without url', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-username test', function (code, stdout, stderr) {
            expect(code).to.equal(1);
            expect(stderr).to.be.ok;
            done();
        });
    });

    it('should give error if password provided without url', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-username test', function (code, stdout, stderr) {
            expect(code).to.equal(1);
            expect(stderr).to.be.ok;
            done();
        });
    });

    it('should run correctly if url and username is provided', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-url 127.0.0.0:1 --proxy-username test', function (code, stdout, stderr) {
            expect(stderr).not.to.be.ok;
            expect(stdout).to.include('Sample Postman Collection');
            done();
        });
    });
    it('should run correctly if url,username and password is provided properly', function (done) {
        // eslint-disable-next-line max-len
        exec('node bin/newman.js run examples/sample-collection.json --proxy-url ip:port --proxy-username test --proxy-password test',
            function (code, stdout, stderr) {
                expect(stderr).not.to.be.ok;
                expect(stdout).to.include('Sample Postman Collection');
                done();
            });
    });
});
