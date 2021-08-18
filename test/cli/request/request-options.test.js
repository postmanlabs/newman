var newmanVersion = require('../../../package.json').version;

describe('Curl Options', function () {
    it('should work correctly without any extra options', function (done) {
        exec('node ./bin/newman.js request http://google.com', done);
    });

    it('should display the current Newman version with `--version`', function (done) {
        exec('node ./bin/newman.js --version', function (code, stdout, stderr) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout).to.equal(`${newmanVersion}\n`);
            expect(stderr).to.equal('');
            done();
        });
    });

    it('should display the current Newman version with `-v`', function (done) {
        exec('node ./bin/newman.js -v', function (code, stdout, stderr) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout).to.equal(`${newmanVersion}\n`);
            expect(stderr).to.equal('');
            done();
        });
    });

    it('should display help message if no arguments are provided', function (done) {
        exec('node ./bin/newman.js', function (code, stdout, stderr) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr).to.match(/Usage: newman*/);
            expect(stdout).to.equal('');
            done();
        });
    });

    it('should not work without the url', function (done) {
        exec('node ./bin/newman.js request', function (code) {
            expect(code, 'should have exit code of 1').to.equal(1);
            done();
        });
    });

    it('should correctly work with --request curl option', function (done) {
        exec('node ./bin/newman.js request -X GET http://www.google.com', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with --request, --header curl options', function (done) {
        // eslint-disable-next-line max-len, quotes
        exec("node ./bin/newman.js request -X POST  https://postman-echo.com/post -H 'Content-Type: text/plain'", function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with --form curl options', function (done) {
        // eslint-disable-next-line max-len, quotes
        exec("node ./bin/newman.js request -X POST -F 'username=davidwalsh' -F 'password=something' https://postman-echo.com/post", function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with --request, --header, --user-agent, --data curl options', function (done) {
        // eslint-disable-next-line max-len, quotes
        exec(`node ./bin/newman.js request -X POST  https://postman-echo.com/post -d '{"hello":"world"}' -H 'Content-Type: text/json' -H 'Scheme: https' --user-agent 'mobile app'`, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with --head curl options', function (done) {
        exec('node ./bin/newman.js request -I https://postman-echo.com/post', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with -G curl options', function (done) {
        exec('node ./bin/newman.js request -G https://google.com', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
});

