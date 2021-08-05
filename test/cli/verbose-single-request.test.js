var _ = require('lodash');

describe('newman request --verbose', function () {
    var verboseStrings = [
        'addresses',
        'tls',
        'protocol',
        'ephemeralKeyInfo',
        'peerCertificate'
    ];

    it('should include verbose with --verbose option', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-xml-unformatted" --verbose', function (code, stdout) {
            _.forEach(verboseStrings, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    it('should not include verbose without --verbose option', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-xml-unformatted"', function (code, stdout) {
            _.forEach(verboseStrings, function (str) {
                expect(stdout).to.not.contain(str);
            });

            done();
        });
    });
});
