#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all system tests.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),

    Mocha = require('mocha'),
    colors = require('colors/safe'),
    recursive = require('recursive-readdir'),
    { exec } = require('shelljs'),

    SPEC_SOURCE_DIR = path.join(__dirname, '..', 'test', 'system');

module.exports = function (exit) {
    // banner line
    console.info(colors.yellow.bold('\nRunning system tests using mocha...'));

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
            if (runError) {
                console.error(runError.stack || runError);

                return exit(1);
            }

            // ensure all dependencies are okay
            console.info(colors.yellow('checking package dependencies...\n'));
            exec('dependency-check ./package.json --extra --no-dev --missing', (code) => {
                exit(code ? 1 : 0);
            });
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
