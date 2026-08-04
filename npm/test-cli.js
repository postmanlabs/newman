#!/usr/bin/env node
/* eslint-disable no-process-env */
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all cli tests.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),

    Mocha = require('mocha'),
    exec = require('shelljs').exec,
    colors = require('colors/safe'),
    recursive = require('recursive-readdir'),

    servers = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers')),
    runner = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers', 'runner')),

    SPEC_SOURCE_DIR = path.join('test', 'cli');

module.exports = function (exit) {
    var live,
        hadNodeOptions = Object.hasOwn(process.env, 'NODE_OPTIONS'),
        previousNodeOptions = hadNodeOptions ? process.env.NODE_OPTIONS : null;

    /**
     * Restores `NODE_OPTIONS`, deleting it when it was unset rather than writing `'undefined'` into it.
     *
     * @returns {undefined} nothing.
     */
    function restoreNodeOptions () {
        if (hadNodeOptions) {
            process.env.NODE_OPTIONS = previousNodeOptions;

            return;
        }

        delete process.env.NODE_OPTIONS;
    }

    // banner line
    console.info(colors.yellow.bold('Running CLI integration tests using mocha and shelljs...'));

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

        // `addFile` only queues, `run` loads, so the interception seams go in before any spec file is required
        runner.startForRunner({ block: !live }, (startError, cleanup) => {
            if (startError) {
                console.error(startError.stack || startError);

                return exit(1);
            }

            // hand the policy to every `node ./bin/newman.js` a spec spawns. Appended, not assigned: NYC's own
            // `--require` is already in there and dropping it takes CLI coverage to nearly zero.
            if (!live) {
                process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, servers.PRELOAD_REQUIRE]
                    .filter(Boolean).join(' ');
            }

            // override exec for it to become silent by default
            global.exec = function (cmd, done) {
                return exec(cmd, { silent: true }, done);
            };

            // start the mocha run
            return mocha.run((runError) => {
                delete global.exec;
                restoreNodeOptions();

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
