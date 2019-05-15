var path = require('path'),

    dir = path.resolve(__dirname, '../fixtures/files'),
    workingDir = dir + '/work-dir';

describe.only('newman run --working-dir --no-insecure-file-read', function () {
    it('should resolve file present inside working directory', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-file-inside.json --working-dir ${workingDir}`, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should not resolve file present outside working directory with insecure file read disabled', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-file-outside.json --working-dir ${workingDir} --no-insecure-file-read`, function (code, stdout) {
            expect(code, 'should have exit code of 1').to.equal(0);
            expect(stdout).to.have.string('PPERM');
            done();
        });
    });

    it('should resolve file present outside working directory with insecure file read enabled', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-file-outside.json --working-dir ${workingDir}`, function (code, stdout) {
            expect(code, 'should have exit code of 1').to.equal(0);
            expect(stdout).to.not.have.string('PPERM');

            // As we cannot set an absolute path in the test, we are going to test for file not found
            // to establish file was resolved
            expect(stdout).to.have.string('no such file');
            done();
        });
    });
});
