describe('CLI reporter logging timestamp', function () {
    var timeRegex = /([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/,
        // eslint-disable-next-line max-len
        utcRegex = /[0-3][0-9]\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s[1-9][0-9]{3}\s([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;

    it('should log timestamp', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-show-timestamp',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(timeRegex);
                expect(stdout).to.not.match(utcRegex);

                done(code);
            });
    });

    it('should log utc timestamp', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-show-timestamp-utc',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(timeRegex);
                expect(stdout).to.match(utcRegex);

                done(code);
            });
    });
});
