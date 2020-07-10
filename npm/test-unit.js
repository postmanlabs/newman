#!/usr/bin/env node
/* eslint-env node, es6 */
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all unit tests.
// ---------------------------------------------------------------------------------------------------------------------

require('shelljs/global');
require('colors');

// set directories and files for test and coverage report
var path = require('path'),
    expect = require('chai').expect,
    recursive = require('recursive-readdir'),

    SPEC_SOURCE_DIR = path.join(__dirname, '..', 'test', 'unit');

module.exports = function (exit) {
    let isWin = (/^win/).test(process.platform),
        outDir = path.join(__dirname, '..', 'out');

    // change the home directory to make sure the home-rc-file doesn't interfere in tests
    // eslint-disable-next-line no-process-env
    process.env[isWin ? 'userprofile' : 'HOME'] = outDir;

    // banner line
    console.info('Running unit tests using mocha...'.yellow.bold);

    var Mocha = require('mocha');

    // add all spec files to mocha
    recursive(SPEC_SOURCE_DIR, function (err, files) {
        if (err) {
            console.error(err);

            return exit(1);
        }

        var mocha = new Mocha({ timeout: 1000 * 60 });

        files.filter(function (file) { // extract all test files
            return (file.substr(-8) === '.test.js');
        }).forEach(mocha.addFile.bind(mocha));

        // start the mocha run
        global.expect = expect; // for easy reference

        mocha.run(function (runError) {
            // clear references and overrides
            delete global.expect;

            runError && console.error(runError.stack || runError);

            exit(runError || process.exitCode ? 1 : 0);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
