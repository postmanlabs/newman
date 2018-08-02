var fs = require('fs');

describe('CLI output', function () {
    var coloredOutput = /\u001b\[/; // eslint-disable-line no-control-regex

    describe('TTY', function () {
        // @todo: Change to assert colored output after https://github.com/shelljs/shelljs/pull/524 is released
        // figure out a way to have `process.stdout.isTTY` true for the child process.
        it.skip('should produce colored output without any options', function (done) {
            exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json', function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(coloredOutput);

                done(code);
            });
        });

        it('should produce colored output with `--color on`', function (done) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --color on', function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(coloredOutput);

                done(code);
            });
        });

        it('should not produce colored output with `--color off`', function (done) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --color off', function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.not.match(coloredOutput);

                done(code);
            });
        });
    });

    describe('noTTY', function () {
        var encoding = 'utf-8',
            outFile = 'out/color-tty-test.txt';

        beforeEach(function (done) {
            fs.stat('out', function (err) {
                if (err) {
                    return fs.mkdir('out', done);
                }

                done();
            });
        });

        afterEach(function (done) {
            fs.stat(outFile, function (err) {
                if (err) {
                    return done();
                }

                fs.unlink(outFile, done);
            });
        });

        // @todo figure out a way to have `process.stdout.isTTY` true for the child process.
        // using `tty.WriteStream` might solve the problem.
        it.skip('should produce colored output without any options', function (done) {
            exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json > ${outFile}`,
                function (code, stdout, stderr) {
                    expect(code, 'should have exit code of 0').to.equal(0);
                    expect(stderr).to.be.empty;
                    expect(stdout).to.be.empty;

                    fs.readFile(outFile, encoding, function (err, data) {
                        if (err) { return done(err); }

                        expect(data).to.match(coloredOutput);
                        done();
                    });
                });
        });

        it('should produce colored output with `--color on`', function (done) {
            exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json --color on > ${outFile}`,
                function (code, stdout, stderr) {
                    expect(code, 'should have exit code of 0').to.equal(0);
                    expect(stderr).to.be.empty;
                    expect(stdout).to.be.empty;

                    fs.readFile(outFile, encoding, function (err, data) {
                        if (err) { return done(err); }

                        expect(data).to.match(coloredOutput);
                        done();
                    });
                });
        });

        it('should not produce colored output with `--color off`', function (done) {
            exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json --color off > ${outFile}`,
                function (code, stdout, stderr) {
                    expect(code, 'should have exit code of 0').to.equal(0);
                    expect(stderr).to.be.empty;
                    expect(stdout).to.be.empty;

                    fs.readFile(outFile, encoding, function (err, data) {
                        if (err) { return done(err); }

                        expect(data).to.not.match(coloredOutput);
                        done();
                    });
                });
        });
    });
});
