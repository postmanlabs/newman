// The `exec` the CLI specs call, installed as a global.
//
// A module rather than an inline assignment in `npm/test-cli.js` because the specs run in Mocha worker processes,
// which load this through Mocha's `require` option. The runner loads it directly, so both get the same definition.

const { exec } = require('shelljs');

// silent by default, so a spec's own assertions are the only thing on stdout
global.exec = function (cmd, done) {
    return exec(cmd, { silent: true }, done);
};
