// Minimal fs-extra helpers used by the SSL client cert tests, without adding a dependency.
module.exports = function () {
    var fs = require('fs'),
        path = require('path');

    return {
        ensureDirSync: function (dir) {
            fs.mkdirSync(dir, { recursive: true });
        },
        copySync: function (src, dest) {
            fs.copyFileSync(src, dest);
        },
        writeJsonSync: function (file, data) {
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, JSON.stringify(data));
        },
        removeSync: function (dir) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    };
};
