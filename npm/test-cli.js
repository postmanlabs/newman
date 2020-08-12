#!/usr/bin/env node
require('shelljs/global');
require('colors');

var _ = require('lodash'),
    Mocha = require('mocha'),
    expect = require('chai').expect,
    join = require('path').join,
    recursive = require('recursive-readdir'),

    execOptions = { silent: true },

    /**
     * The directory containing CLI test specs.
     *
     * @type {String}
     */
    SPEC_SOURCE_DIR = './test/cli';

module.exports = function (exit) {
    let isWin = (/^win/).test(process.platform),
        outDir = join(__dirname, '..', 'out');

    // change the home directory to make sure the home-rc-file doesn't interfere in tests
    // eslint-disable-next-line no-process-env
    process.env[isWin ? 'userprofile' : 'HOME'] = outDir;

    // Used to indicate the child processes that their execution is during a test
    // This slightly alters their logic to test some cases
    // eslint-disable-next-line no-process-env
    process.env.NEWMAN_TEST_ENV = 'cli';

    // banner line
    console.info('Running CLI integration tests using mocha and shelljs...'.yellow.bold);

    var mocha = new Mocha({ timeout: 60000 });

    recursive(SPEC_SOURCE_DIR, function (err, files) {
        if (err) {
            console.error(err);

            return exit(1);
        }

        var _exec = global.exec; // need to restore it later

        files.filter(function (file) {
            return (file.substr(-8) === '.test.js');
        }).forEach(function (file) {
            mocha.addFile(file);
        });

        // start the mocha run
        global.expect = expect; // for easy reference
        global.exec = function (cmd, options, done) { // override exec for it to become silent by default
            if (!done && _.isFunction(options)) {
                done = options;
                options = {};
            }

            return _exec(cmd, { ...execOptions, ...options }, done);
        };

        mocha.run(function (err) {
            delete global.expect; // clear references and overrides
            global.exec = _exec;

            exit(err || process.exitCode ? 1 : 0);
        });
        mocha = null; // cleanup
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
