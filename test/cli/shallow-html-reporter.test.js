/* global describe, it, exec, expect */
var fs = require('fs'),

    sh = require('shelljs');

describe('HTML reporter', function () {
    var outDir = 'out',
        outFile = outDir + '/newman-report.html';

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
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

    it('should correctly produce the html report in a pre-existing directory', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -r html --reporter-html-export out',
            function (code) {
                expect(code).equal(0);

                var dir = fs.readdirSync(outDir),
                    file = dir[0];

                expect(dir).to.have.property('length', 1);
                fs.stat(outDir + '/' + file, done);
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
