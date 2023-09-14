const expect = require('chai').expect,
    // eslint-disable-next-line security/detect-child-process
    exec = require('child_process').execSync;

describe('npm publish', function () {
    const stdout = exec('npm pack --dry-run --json').toString(),
        packageInfo = JSON.parse(stdout.substring(stdout.indexOf('[')))[0],
        packagedFiles = packageInfo.files.map(function (file) { return file.path; });

    it('should have a valid package name', function () {
        expect(packageInfo.name).to.equal('newman');
    });

    it('should not publish unnecessary files', function () {
        const allowedFiles = ['index.js', 'package.json', 'LICENSE.md',
            'README.md', 'CHANGELOG.yaml', 'MIGRATION.md', 'SECURITY.md'];

        packagedFiles.forEach(function (path) {
            expect(allowedFiles.includes(path) || path.startsWith('lib/') ||
            path.startsWith('bin/') || path.startsWith('docker/')).to.be.true;
        });
    });
});
