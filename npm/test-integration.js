#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all integration tests.
// ---------------------------------------------------------------------------------------------------------------------

const fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    async = require('async'),
    colors = require('colors/safe'),
    recursive = require('recursive-readdir'),
    newman = require(path.join(__dirname, '..', 'index')),

    servers = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers')),
    runner = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers', 'runner')),

    SPEC_SOURCE_DIR = path.join(__dirname, '..', 'test', 'integration');

module.exports = function (exit) {
    var live,

        // replaced by the runner's own teardown once the fixture servers are up; until then there is nothing to
        // take down
        cleanup = function (done) {
            return done();
        };

    // banner line
    console.info(colors.yellow.bold('Running integration tests using local newman as node module...'));

    try {
        live = runner.parseArgs(process.argv.slice(2)).live;
    }
    catch (parseError) {
        console.error(colors.red(parseError.message));

        return exit(1);
    }

    async.waterfall([

        /**
         * Fetch all files within SPEC_SOURCE_DIR.
         *
         * @param {Function} next - A callback function that is invoked after the files have been fetched.
         * @returns {*}
         */
        function (next) {
            recursive(SPEC_SOURCE_DIR, next);
        },

        /**
         * Ensures that we proceed only if files exist and has appropriate name conventions.
         *
         * @param {Array} files - An array of strings, each of which represents the path to an integration test file.
         * @param {Function} next - A callback function whose invocation marks the end of the file processing routine.
         * @returns {*}
         */
        function (files, next) {
            next(null, _.reduce(files, function (suites, path) {
                // regex: [0:path, 1:test, 2:syntax, 3:skipped, 4: file-format]
                const parts = path.match(/(.+)\.postman_([^.]+)(\.skip)?\.([^.]{3,})$/i);

                if (!parts) { // if a spec file did not match the pattern, log warning and move on
                    return (console.warn(colors.gray(` - ignored: ${path}`)), suites);
                }
                else if (parts[3]) { // do not parse skipped files
                    return (console.warn(colors.cyan(` - skipped: ${path}`)), suites);
                }

                // add the test to the tracking object
                (suites[parts[1]] || (suites[parts[1]] = {
                    name: parts[1]
                }))[`${parts[2]}${parts[4].toUpperCase()}`] = path;

                return suites;
            }, {}));
        },

        /**
         * Start the local servers the collections use, and install the network policy built from their real ports
         *   - raw-echo    = custom HTTP method, body with GET
         *   - redirect    = protocol profile behavior
         *   - echo        = every mapped public host, served locally
         *   - client-cert = the mutual-TLS servers, unused here
         *
         * Under `--live` the same servers start but no policy is installed, so every non-local collection URL
         * reaches its real public service.
         *
         * @param {Object} suites - An set of tests, arranged by test group names as keys.
         * @param {Function} next - A callback function whose invocation marks the end of the integration test run.
         * @returns {*}
         */
        function (suites, next) {
            runner.startForRunner({ block: !live }, function (err, teardown) {
                teardown && (cleanup = teardown);

                next(err, suites);
            });
        },

        /**
         * Execute each integration test suite using newman.
         *
         * @param {Object} suites - An set of tests, arranged by test group names as keys.
         * @param {Function} next - A callback function whose invocation marks the end of the integration test run.
         * @returns {*}
         */
        function (suites, next) {
            if (_.isEmpty(suites)) { // if no test files found, it is an error
                return next(new Error(`No test files found in ${SPEC_SOURCE_DIR}`));
            }

            console.info(`\nexecuting ${Object.keys(suites).length} tests in parallel (might take a while)...\n`);

            // run tests using the consolidated test set as a guide
            async.mapLimit(suites, 10, function (test, next) {
                console.info(` - ${test.name}`);

                // load configuration JSON object if it is provided. We do this since this is not part of newman
                // standard API
                const config = test.configJSON ? JSON.parse(fs.readFileSync(test.configJSON).toString()) : {},

                    // the fixture servers bind ephemeral ports, so the collections name them through variables.
                    // Applied after the merge, not inside it: `_.merge` combines arrays by index, which would
                    // interleave a `config.run.envVar` with these rather than keep both.
                    options = _.merge({
                        collection: test.collectionJSON,
                        environment: test.environmentJSON,
                        globals: test.globalsJSON,
                        iterationData: test.dataCSV || test.dataJSON,
                        abortOnFailure: true
                    }, config.run);

                options.envVar = _.map(servers.ports(), function (value, key) {
                    return { key, value };
                }).concat(options.envVar || []);

                newman.run(options, function (err, summary) {
                    err && (err.source = test); // store the meta in error
                    next(err, summary);
                });
            }, next);
        }
    ],

    /**
     * The integration test exit handler. Receives the error (if at all) from the integration test runner and exits
     * accordingly, displaying either a success message or an error message and it's corresponding stacktrace.
     *
     * @param {?Error} err - An object that is either null or a standard error object.
     * @param {Array} results - An array of integration test result objects, one per integration test collection run.
     * @returns {*}
     */
    function (err, results) {
        if (!err) {
            console.info(colors.green(`\n${results.length} integrations ok!\n`));
        }
        else {
            console.error(colors.red('\nintegration test failed:'));
            console.error(_.omit(err, ['stacktrace', 'stack']), { colors: true });
        }

        // drop the interception seams, then stop the local fixture servers
        cleanup(function (cleanupError) {
            // report a cleanup failure, but never let it mask the test result
            cleanupError && console.error(cleanupError.stack || cleanupError);

            // exit once all the local servers are stopped
            exit(err || process.exitCode ? 1 : 0, results);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
