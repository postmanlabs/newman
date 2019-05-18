var path = require('path'),

    workingDir = path.resolve(__dirname, '../fixtures/files/work-dir');

describe('newman.run workingDir', function () {
    it('should resolve file present inside working directory', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-file-inside.json',
            workingDir: workingDir
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
            expect(summary.run.stats.assertions.total, 'should have 2 assertions').to.equal(2);
            expect(summary.run.stats.assertions.failed, 'should not have failing tests').to.equal(0);
            expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
            done();
        });
    });

    it('should not resolve file present outside working directory with insecureFileRead=false', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-file-outside.json',
            workingDir: workingDir,
            insecureFileRead: false
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
            expect(summary.run.stats.assertions.total, 'should have 2 assertions').to.equal(2);
            expect(summary.run.stats.assertions.failed, 'should not 2 failing tests').to.equal(2);
            expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
            done();
        });
    });

    it('should resolve file present outside working directory by default', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-file-outside.json',
            workingDir: workingDir
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
            expect(summary.run.stats.assertions.total, 'should have 2 assertions').to.equal(2);
            expect(summary.run.stats.assertions.failed, 'should not have failing tests').to.equal(0);
            expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
            done();
        });
    });
});
