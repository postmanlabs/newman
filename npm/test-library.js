#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all library tests.
// ---------------------------------------------------------------------------------------------------------------------

const Mocha = require('mocha'),
    path = require('path'),
    recursive = require('recursive-readdir'),

    SPEC_SOURCE_DIR = path.join('test', 'library');

module.exports = function (exit) {
    // banner line
    console.info(colors.yellow.bold('Running library tests using mocha on node...'));

    // add all spec files to mocha
    recursive(SPEC_SOURCE_DIR, (err, files) => {
        if (err) {
            console.error(err);

            return exit(1);
        }

        const mocha = new Mocha({ timeout: 1000 * 60 });

        files.filter((file) => { // extract all test files
            return (file.substr(-8) === '.test.js');
        }).forEach(mocha.addFile.bind(mocha));

        // start the mocha run
        mocha.run((runError) => {
            runError && console.error(runError.stack || runError);

            exit(runError || process.exitCode ? 1 : 0);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
