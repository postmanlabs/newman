var _ = require('lodash');

describe('newman run --verbose', function () {
    var verboseStrings = [
            'prepare',
            'wait',
            'dns-lookup',
            'tcp-handshake',
            'ssl-handshake',
            'transfer-start',
            'download',
            'process',
            'average DNS lookup time:',
            'average first byte time:'
        ],
        endTags = [
            '</body>',
            '</html>'
        ];

    it('should include verbose with --verbose option', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --verbose', function (code, stdout) {
            _.forEach(verboseStrings, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    it('should not include verbose without --verbose option', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json', function (code, stdout) {
            _.forEach(verboseStrings, function (str) {
                expect(stdout).to.not.contain(str);
            });

            done();
        });
    });

    it('should limit to 2KB with --verbose option only without setting verbose-output-limit', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.not.contain(str);
            });

            done();
        });
    });

    it('should log the entire output --verbose option and --reporter-cli-no-verbose-output-limit set', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-no-verbose-output-limit', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    it('should log more output when verbose-output-limit set to 4KB than 2KB', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-verbose-output-limit 4kb', function (_code, largeStdout) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-verbose-output-limit 2kb', function (_code, smallStdout) {
                expect(largeStdout.length).to.be.greaterThan(smallStdout.length);
                done();
            });
        });
    });

    it('should display twice as much as verbose output when limit set to 2KB than 1KB', function (done) {
        var output_response_start = '"args":{"continuousNumberArray":',
            output_response_end = '(showing';

        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/continuous-data.json --verbose --reporter-cli-verbose-output-limit 2kb', function (_code, largeStdout) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/continuous-data.json --verbose --reporter-cli-verbose-output-limit 1kb', function (_code, smallStdout) {
                // eslint-disable-next-line max-len
                var largeStdoutResponseOnly = largeStdout.slice(largeStdout.indexOf(output_response_start), largeStdout.indexOf(output_response_end)),
                    // eslint-disable-next-line max-len
                    smallStdoutResponseOnly = largeStdout.slice(smallStdout.indexOf(output_response_start), smallStdout.indexOf(output_response_end));


                /*
                1000-1197 = ~200 characters
                1000-1402 = ~400 characters
                Thus setting output limit to 2kb ensure almost twice output size as compared to 1kb
                */
                expect(smallStdoutResponseOnly).to.contain('1197');
                expect(largeStdoutResponseOnly).to.contain('1402');
                expect(largeStdoutResponseOnly.length).to.be.greaterThan(smallStdoutResponseOnly.length);
                done();
            });
        });
    });

    it('should display a warning and fallback to 2KB when invalid verbose-output-limit is passed', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-verbose-output-limit postman', function (_code, stdout) {
            expect(stdout).to.contain('Invalid value');
            expect(stdout).to.contain('showing 2.05');
            done();
        });
    });
});
