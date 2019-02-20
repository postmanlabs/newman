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
});
