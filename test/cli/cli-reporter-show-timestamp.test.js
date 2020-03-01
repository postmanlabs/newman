describe('CLI reporter logging timestamp', function () {
    var dateRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s[0-3][0-9]\s[1-9][0-9]{3}/,
        timeRegex = /([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/,
        tzRegex = /GMT[+-](?:2[0-3]|[01][0-9])[0-5][0-9]/;

    it('should log timestamp', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-show-timestamp',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(dateRegex);
                expect(stdout).to.match(timeRegex);
                expect(stdout).to.match(tzRegex);

                done(code);
            });
    });

    it('should log timestamp without timezone', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json --reporter-cli-show-timestamp-no-tz',
            function (code, stdout, stderr) {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout).to.match(dateRegex);
                expect(stdout).to.match(timeRegex);
                expect(stdout).to.not.match(tzRegex);

                done(code);
            });
    });
});
