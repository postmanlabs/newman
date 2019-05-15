var path = require('path'),

    workingDir = path.resolve(__dirname, '../fixtures/files/work-dir');

describe('newman run --working-dir --no-insecure-file-read', function () {
    it('should resolve file present inside working directory', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-file-inside.json --working-dir ${workingDir}`, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should not resolve file present outside working directory with --no-insecure-file-read', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-file-outside.json --working-dir ${workingDir} --no-insecure-file-read`, function (code, stdout) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stdout).to.have.string('AssertionError');
            done();
        });
    });

    it('should resolve file present outside working directory by default', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-file-outside.json --working-dir ${workingDir}`, function (code, stdout) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout).to.not.have.string('AssertionError');
            done();
        });
    });
});
