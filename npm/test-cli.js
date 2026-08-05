#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all cli tests.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),

    Mocha = require('mocha'),
    colors = require('colors/safe'),
    recursive = require('recursive-readdir'),

    mochaOptions = require(path.join(__dirname, 'mocha-options')),

    CLI_GLOBALS = path.join(__dirname, '..', 'test', 'fixtures', 'cli-globals.js'),

    // Mocha's `require` option only reaches workers, so `global.exec` is loaded here too for the serial fallback.
    // eslint-disable-next-line no-unused-vars
    cliGlobals = require(CLI_GLOBALS),

    SPEC_SOURCE_DIR = path.join('test', 'cli');

module.exports = function (exit) {
    // banner line
    console.info(colors.yellow.bold('Running CLI integration tests using mocha and shelljs...'));

    // add all spec files to mocha
    recursive(SPEC_SOURCE_DIR, (err, files) => {
        if (err) {
            console.error(err);

            return exit(1);
        }

        const specs = files.filter((file) => { // extract all test files
                return (file.substr(-8) === '.test.js');
            }),
            mocha = new Mocha(mochaOptions(specs, [CLI_GLOBALS]));

        specs.forEach(mocha.addFile.bind(mocha));

        // start the mocha run
        mocha.run((runError) => {
            runError && console.error(runError.stack || runError);

            exit(runError || process.exitCode ? 1 : 0);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
