const expect = require('chai').expect;

describe('CLI reporter logging timestamp', function () {
    const timeRegex = /([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;

    it('should log timestamp', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-show-timestamps',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(timeRegex);

                done(code);
            });
    });
});
