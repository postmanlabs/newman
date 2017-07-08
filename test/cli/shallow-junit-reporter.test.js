var fs = require('fs');

describe('JUnit reporter', function () {
    var outFile = 'out/newman-report.xml';

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

    it('should correctly generate the junit report for a successful run', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code).be(0);
                fs.stat(outFile, done);
            });
    });

    it('should correctly generate the junit report for a failed run', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-request-failing.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code).be(1);
                fs.stat(outFile, done);
            });
    });

    it('should correctly produce the junit report for a run with TypeError', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/newman-report-test.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code).be(1);
                fs.stat(outFile, done);
            });
    });
});
