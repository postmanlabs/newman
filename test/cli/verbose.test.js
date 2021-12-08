const { expect } = require('chai');
var _ = require('lodash');
const { exec } = require('shelljs');

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

    it('should limit to 2KB with --verbose option only without setting output-size', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.not.contain(str);
            });

            done();
        });
    });

    it('should log the entire output --verbose option and --output-size set to infinte', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --output-size infinite', function (_code, stdout) {
            _.forEach(endTags, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    it('should log more output when --output-size set to 4KB than 2KB', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --output-size 4', function (_code, largeStdout) {
            // eslint-disable-next-line max-len
            exec('node ./bin/newman.js run test/fixtures/run/large-output-get-request.json --verbose --output-size 2', function (_code, smallStdout) {
                expect(largeStdout.length).to.be.greaterThan(smallStdout.length);
                done();
            });
        });
    });
});
