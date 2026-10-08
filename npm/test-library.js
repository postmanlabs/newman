#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all library tests.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),

    colors = require('colors/safe'),
    Mocha = require('mocha'),
    recursive = require('recursive-readdir'),

    servers = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers')),
    runner = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers', 'runner')),
    mochaOptions = require(path.join(__dirname, 'mocha-options')),

    SPEC_SOURCE_DIR = path.join('test', 'library');

module.exports = function (exit) {
    var live;

    // banner line
    console.info(colors.yellow.bold('Running library tests using mocha on node...'));

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

        // parallel workers run in their own processes, so each installs the interception policy for itself:
        // `preload.js` reads `NEWMAN_TEST_NET` out of the inherited environment
        const specs = files.filter((file) => { // extract all test files
                return (file.substr(-8) === '.test.js');
            }),
            mocha = new Mocha(mochaOptions(specs, [servers.PRELOAD]));

        specs.forEach(mocha.addFile.bind(mocha));

        // `addFile` only queues, `run` loads, so the interception seams go in before any spec file is required.
        // Nock, which `postman-api-key.test.js` pulls in, patches `http.ClientRequest` above the socket: the two
        // layers are independent, and a Nock passthrough still traverses `net.Socket.prototype.connect`.
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
