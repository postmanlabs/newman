#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all unit tests.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),

    colors = require('colors/safe'),
    Mocha = require('mocha'),
    recursive = require('recursive-readdir'),

    runner = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers', 'runner')),

    SPEC_SOURCE_DIR = path.join('test', 'unit');

module.exports = function (exit) {
    var live;

    // banner line
    console.info(colors.yellow.bold('Running unit tests using mocha on node...'));

    try {
        live = runner.parseArgs(process.argv.slice(2)).live;
    }
    catch (parseError) {
        console.error(colors.red(parseError.message));

        return exit(1);
    }

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

        // The unit suite does make requests: the reporter and CLI specs run
        // `test/fixtures/run/single-get-request.json`, which hits `https://postman-echo.com/get`. So it needs the
        // full mapped policy, not a block-only one, or `intercept.js` fails the run on every blocked connection.
        //
        // `addFile` only queues, `run` loads, so the seams go in before any spec file is required.
        runner.startForRunner({ block: !live }, (startError, cleanup) => {
            if (startError) {
                console.error(startError.stack || startError);

                return exit(1);
            }

            // start the mocha run
            return mocha.run((runError) => {
                runError && console.error(runError.stack || runError);

                cleanup((cleanupError) => {
                    // report a cleanup failure, but never let it mask the test result
                    cleanupError && console.error(cleanupError.stack || cleanupError);

                    exit(runError || process.exitCode ? 1 : 0);
                });
            });
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
