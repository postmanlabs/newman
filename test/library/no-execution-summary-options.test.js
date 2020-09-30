var fs = require('fs'),

    _ = require('lodash'),
    sh = require('shelljs');

describe('JSON reporter', function () {
    var outDir = 'out',
        outFile = outDir + '/newman-report.json';

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
    });

    it('should correctly generate the json report with skip-executions option enabled', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['json'],
            reporter: { json: { export: outFile } },
            executionsSummary: false
        }, function (err) {
            if (err) { return done(err); }

            fs.readFile(outFile, function (err, data) {
                expect(err).to.not.be.ok;
                const jsonReport = JSON.parse(data),
                    executions = jsonReport.run.executions;

                expect(jsonReport).to.have.property('run');
                expect(_.keys(jsonReport.run).sort())
                    .to.eql(['stats', 'timings', 'executions', 'transfers', 'failures', 'error'].sort());
                expect(executions).to.be.an('array');
                expect(executions, 'should have 0 executions').to.have.lengthOf(0);
                done();
            });
        });
    });

    it('should correctly generate the json report with skip-executions option disabled', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['json'],
            reporter: { json: { export: outFile } },
            executionsSummary: true
        }, function (err) {
            if (err) { return done(err); }

            fs.readFile(outFile, function (err, data) {
                expect(err).to.not.be.ok;
                const jsonReport = JSON.parse(data),
                    executions = jsonReport.run.executions;

                expect(jsonReport).to.have.property('run');
                expect(_.keys(jsonReport.run).sort())
                    .to.eql(['stats', 'timings', 'executions', 'transfers', 'failures', 'error'].sort());
                expect(executions).to.be.an('array');
                expect(executions, 'should have 1 executions').to.have.lengthOf(1);
                done();
            });
        });
    });
});
