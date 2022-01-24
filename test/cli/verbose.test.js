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

    it('should limit to 2KB with --verbose option only without setting truncate-body-output', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.not.contain(str);
            });

            done();
        });
    });

    it('should log the entire output when infinity is passed to --truncate-body-output', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-truncate-body-output infinity', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    // eslint-disable-next-line max-len
    it('should log the entire output when infinity is passed to --truncate-body-output without considering case', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-truncate-body-output InFiNiTy', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.contain(str);
            });
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-truncate-body-output INFINITY', function (_code, stdout) {
                _.forEach(endTags, function (str) {
                    expect(stdout).to.contain(str);
                });

                done();
            });
        });
    });

    it('should display twice as much as verbose output when limit set to 2KB than 1KB', function (done) {
        var output_response_start = '"args"',
            output_response_end = '(showing';

        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/continuous-data.json --verbose --reporter-cli-truncate-body-output 2kb', function (_code, largeStdout) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/continuous-data.json --verbose --reporter-cli-truncate-body-output 1kb', function (_code, smallStdout) {
                // eslint-disable-next-line max-len
                var largeStdoutResponseOnly = largeStdout.slice(largeStdout.indexOf(output_response_start), largeStdout.lastIndexOf(output_response_end)),
                    // eslint-disable-next-line max-len
                    smallStdoutResponseOnly = smallStdout.slice(smallStdout.indexOf(output_response_start), smallStdout.lastIndexOf(output_response_end));

                /*
                1000-1193 = 193 characters
                1000-1398 = 398 ~= 193 * 2 characters
                Thus setting output limit to 2kb ensure almost twice output size as compared to 1kb
                */
                expect(smallStdoutResponseOnly).to.contain('1193');
                expect(largeStdoutResponseOnly).to.contain('1398');
                expect(largeStdoutResponseOnly.length).to.be.greaterThan(smallStdoutResponseOnly.length);
                // eslint-disable-next-line max-len
                expect(Math.abs(largeStdoutResponseOnly.length - smallStdoutResponseOnly.length * 2)).to.be.lessThanOrEqual(1);
                done();
            });
        });
    });

    it('should display a warning and fallback to 2KB when invalid truncate-body-output is passed', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --reporter-cli-truncate-body-output postman', function (_code, stdout) {
            expect(stdout).to.contain('Invalid value');
            expect(stdout).to.contain('showing 2.05');
            done();
        });
    });

    it('should limit both request and response body output when truncate-body-output is passed', function (done) {
        var output_response_start = '"args"';

        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/continuous-data.json --verbose --reporter-cli-truncate-body-output 0.5kb', function (_code, stdout) {
            var responseStartIndex = stdout.indexOf(output_response_start),
                request = stdout.slice(0, responseStartIndex),
                response = stdout.slice(0, responseStartIndex);

            expect(request).to.contain('512B');
            expect(response).to.contain('512B');
            done();
        });
    });
});
