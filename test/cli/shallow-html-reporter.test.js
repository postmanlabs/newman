var fs = require('fs');

describe('HTML reporter', function () {
    var outFile = 'out/newman-report.html';

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

    it('should correctly generate the html report for a successful run', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json -r html --reporter-html-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(0);
                fs.stat(outFile, done);
            });
    });

    it('should correctly generate the html report for a failed run', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-request-failing.json -r html --reporter-html-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 1').to.equal(1);
                fs.stat(outFile, done);
            });
    });

    it('should correctly produce the html report for a run with TypeError', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/newman-report-test.json -r html --reporter-html-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 1').to.equal(1);
                fs.stat(outFile, done);
            });
    });

    it('should correctly produce the html report for a run with one or more failed requests', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/failed-request.json -r html --reporter-html-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 1').to.equal(1);
                fs.stat(outFile, done);
            });
    });

    it('should correctly handle the `--reporter-html-export=` argument', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json -r html --reporter-html-export=${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(0);
                fs.stat(outFile, done);
            });
    });
});
