#!/usr/bin/env node
require('shelljs/global');
require('colors');

var Mocha = require('mocha'),
    newman = require('../index'),
    expect = require('chai').expect,
    recursive = require('recursive-readdir'),
    NYC = require('nyc'),

    /**
     * The directory containing library test specs.
     *
     * @type {String}
     */
    SPEC_SOURCE_DIR = './test/library',
    COV_REPORT_PATH = '.coverage';

module.exports = function (exit) {
    // banner line
    console.info('Running Library integration tests using mocha and shelljs...'.yellow.bold);

    var mocha = new Mocha({ timeout: 60000 }),
        nyc = new NYC({
            hookRequire: true,
            reporter: ['text', 'lcov', 'text-summary', 'json'],
            reportDir: COV_REPORT_PATH,
            tempDirectory: COV_REPORT_PATH
        });

    nyc.reset();
    nyc.wrap();

    recursive(SPEC_SOURCE_DIR, function (err, files) {
        if (err) {
            console.error(err);

            return exit(1);
        }

        files.filter(function (file) {
            return (file.substr(-8) === '.test.js');
        }).forEach(function (file) {
            mocha.addFile(file);
        });

        // start the mocha run
        global.expect = expect; // for easy reference
        global.newman = newman;

        mocha.run(function (err) {
            // clear references and overrides
            delete global.expect;
            delete global.newman;

            nyc.writeCoverageFile();
            nyc.report();
            nyc.checkCoverage({
                statements: 65,
                branches: 45,
                functions: 65,
                lines: 65
            });

            exit(err || process.exitCode ? 1 : 0);
        });
        mocha = null; // cleanup
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
