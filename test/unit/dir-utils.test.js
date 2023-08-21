const dirUtils = require('../../lib/commands/dir-utils'),
    fs = require('fs');


describe('dir-utils tests', function () {
    it('should create a temp dir', function (done) {
        const dir = dirUtils.createTempDir();

        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });
});
