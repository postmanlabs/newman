var fs = require('fs');

describe('CLI output', function () {
    var coloredOutput = /\u001b\[/;

    describe('TTY', function () {
        // @todo: Change to assert colored output after https://github.com/shelljs/shelljs/pull/524 is released
        it('should not produce colored output without any options', function (done) {
            exec('node ./bin/newman.js run test/cli/single-get-request.json', function (code, stdout, stderr) {
                expect(code).be(0);
                expect(stderr).to.be.empty();
                expect(stdout).to.not.match(coloredOutput);

                done(code);
            });
        });

        it('should produce colored output with --color', function (done) {
            exec('node ./bin/newman.js run test/cli/single-get-request.json --color', function (code, stdout, stderr) {
                expect(code).be(0);
                expect(stderr).to.be.empty();
                expect(stdout).to.match(coloredOutput);

                done(code);
            });
        });

        it('should not produce colored output with --no-color', function (done) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/cli/single-get-request.json --no-color', function (code, stdout, stderr) {
                expect(code).be(0);
                expect(stderr).to.be.empty();
                expect(stdout).to.not.match(coloredOutput);

                done(code);
            });
        });
    });

    describe('noTTY', function () {
        var encoding = 'utf-8';

        before(function (done) {
            fs.mkdir('out', function (err) {
                console.error(err);
                done();
            });
        });

        it('should not produce colored output without any options', function (done) {
            exec('node ./bin/newman.js run test/cli/single-get-request.json > out/notty.txt',
            function (code, stdout, stderr) {
                expect(code).be(0);
                expect(stderr).to.be.empty();
                expect(stdout).to.be.empty();

                fs.readFile('out/notty.txt', encoding, function (err, data) {
                    if (err) { return done(err); }

                    expect(data).to.not.match(coloredOutput);
                    done();
                });
            });
        });

        it('should produce colored output with --color', function (done) {
            exec('node ./bin/newman.js run test/cli/single-get-request.json --color > out/notty-color.txt',
            function (code, stdout, stderr) {
                expect(code).be(0);
                expect(stderr).to.be.empty();
                expect(stdout).to.be.empty();

                fs.readFile('out/notty-color.txt', encoding, function (err, data) {
                    if (err) { return done(err); }

                    expect(data).to.match(coloredOutput);
                    done();
                });
            });
        });

        it('should not produce colored output with --no-color', function (done) {
            exec('node ./bin/newman.js run test/cli/single-get-request.json --no-color > out/notty-no-color.txt',
            function (code, stdout, stderr) {
                expect(code).be(0);
                expect(stderr).to.be.empty();
                expect(stdout).to.be.empty();

                fs.readFile('out/notty-no-color.txt', encoding, function (err, data) {
                    if (err) { return done(err); }

                    expect(data).to.not.match(coloredOutput);
                    done();
                });
            });
        });
    });
});
