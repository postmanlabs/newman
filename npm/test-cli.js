#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all cli tests.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),

    Mocha = require('mocha'),
    exec = require('shelljs').exec,
    colors = require('colors/safe'),
    recursive = require('recursive-readdir'),

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

        const mocha = new Mocha({ timeout: 1000 * 60 });

        files.filter((file) => { // extract all test files
            return (file.substr(-8) === '.test.js');
        }).forEach(mocha.addFile.bind(mocha));

        // override exec for it to become silent by default
        global.exec = function (cmd, done) {
            return exec(cmd, { silent: true }, done);
        };

        // start the mocha run
        mocha.run((runError) => {
            delete global.exec;
            runError && console.error(runError.stack || runError);

            exit(runError || process.exitCode ? 1 : 0);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
