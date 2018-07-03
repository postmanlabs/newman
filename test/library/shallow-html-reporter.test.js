var fs = require('fs'),

    sh = require('shelljs');

/* global beforeEach, afterEach, describe, it, expect, newman */
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
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['html'],
            reporter: { html: { export: outFile } }
        }, function (err) {
            if (err) { return done(err); }

            fs.stat(outFile, done);
        });
    });

    it('should correctly generate the html report for a failed run', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            reporters: ['html'],
            reporter: { html: { export: outFile } }
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures, 'should have 1 failure').to.have.lengthOf(1);
            fs.stat(outFile, done);
        });
    });

    it('should correctly produce the html report for a run with AssertionError/TypeError', function (done) {
        newman.run({
            collection: 'test/fixtures/run/newman-report-test.json',
            reporters: ['html'],
            reporter: { html: { export: outFile } }
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures, 'should have 2 failures').to.have.lengthOf(2);
            fs.stat(outFile, done);
        });
    });

    it('should correctly produce the html report for a run with one or more failed requests', function (done) {
        newman.run({
            collection: 'test/fixtures/run/failed-request.json',
            reporters: ['html'],
            reporter: { html: { export: outFile } }
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures, 'should have 1 failure').to.have.lengthOf(1);
            fs.stat(outFile, done);
        });
    });

    it('should correctly produce the html report in a pre-existing directory', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['html'],
            reporter: { html: { export: outDir } }
        }, function (err) {
            expect(err).to.be.null;

            var dir = fs.readdirSync(outDir),
                file = dir[0];

            expect(dir).to.have.length(1);
            fs.stat(outDir + '/' + file, done);
        });
    });

    describe('backward compatibility', function () {
        it('should not mutate the run summary', function (done) {
            newman.run({
                collection: 'test/fixtures/run/single-get-request.json',
                reporters: ['html'],
                reporter: { html: { export: outFile } }
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.failures, 'should have 0 failures').to.have.lengthOf(0);

                summary.run.executions.forEach(function (exec) {
                    // The body property is only accessible to the HTML reporter
                    expect(exec.response).to.not.have.property('body');
                });

                fs.stat(outFile, done);
            });
        });
    });
});
