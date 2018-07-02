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

    NYC = require('nyc'),
    recursive = require('recursive-readdir'),

    COV_REPORT_PATH = '.coverage',
    SPEC_SOURCE_DIR = path.join(__dirname, '..', 'test', 'unit');

module.exports = function (exit) {
    // banner line
    console.info('Running unit tests using mocha...'.yellow.bold);

    test('-d', COV_REPORT_PATH) && rm('-rf', COV_REPORT_PATH);
    mkdir('-p', COV_REPORT_PATH);

    var Mocha = require('mocha'),
        nyc = new NYC({
            reporter: ['text', 'lcov'],
            reportDir: COV_REPORT_PATH,
            tempDirectory: COV_REPORT_PATH
        });

    nyc.wrap();
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

            nyc.reset();
            nyc.writeCoverageFile();
            nyc.report();
            exit(runError ? 1 : 0);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
