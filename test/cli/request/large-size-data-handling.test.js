var _ = require('lodash');

describe('Large size data handling', function () {
    var responseStrings = [
        'Response Size is too large.',
        'Please use the JSON reporter (-r JSON) to download the output in a separate file.'
    ];

    it('should should give warning for data size more than the set response-limit', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-long-json" --response-limit 100000', function (code, stdout) {
            _.forEach(responseStrings, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    it('should give warning for data having response-size more than the set response-limit', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-extra-long-json-unformatted" --response-limit 1000000', function (code, stdout) {
            _.forEach(responseStrings, function (str) {
                expect(stdout).to.contain(str);
            });

            done();
        });
    });

    it('should take default value of response-limit in case there is no flag used', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-json"', function (code, stdout) {
            _.forEach(responseStrings, function (str) {
                expect(stdout).to.not.contain(str);
            });

            done();
        });
    });
});
