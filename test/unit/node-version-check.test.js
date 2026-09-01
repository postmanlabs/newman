const childProcess = require('child_process'),
    expect = require('chai').expect,
    path = require('path'),

    versionCheckPath = path.join(__dirname, '..', '..', 'lib', 'node-version-check');

describe('node version check', function () {
    const checkVersion = (version) => {
        return childProcess.spawnSync(process.execPath, [
            '-e',
            'Object.defineProperty(process, "version", { value: process.argv[1] }); require(process.argv[2]);',
            version,
            versionCheckPath
        ], { encoding: 'utf8' });
    };

    it('should accept a supported prerelease version', function () {
        const result = checkVersion('v26.8.0-alpha.0.0.0');

        expect(result.status).to.equal(0);
        expect(result.stderr).to.be.empty;
    });

    it('should reject an unsupported prerelease version', function () {
        const result = checkVersion('v15.99.0-alpha.1');

        expect(result.status).to.equal(1);
        expect(result.stderr).to.include('newman:');
        expect(result.stderr).to.include('required node version >=16');
    });
});
