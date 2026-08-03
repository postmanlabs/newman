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

    { prettyms } = require(path.join(__dirname, '..', 'lib', 'util')),
    symbols = require(path.join(__dirname, '..', 'lib', 'reporters', 'cli', 'cli-utils-symbols'))(false),

    // scaled up from mocha's own 75ms "slow" threshold: a suite here runs a whole collection, not one assertion,
    // so mocha's default would color every suite red
    SLOW = 1000,

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
            next(null, _.reduce(files, function (suites, filePath) {
                // regex: [0:path, 1:test, 2:syntax, 3:skipped, 4: file-format]
                const parts = filePath.match(/(.+)\.postman_([^.]+)(\.skip)?\.([^.]{3,})$/i);

                if (!parts) { // if a spec file did not match the pattern, log warning and move on
                    // only a broken collection/environment/data filename is actionable; a name with no
                    // `.postman_` fragment at all (e.g. a file-upload body) is just a fixture asset
                    if ((/\.postman_/i).test(filePath)) {
                        console.warn(colors.gray(` - ignored: ${path.relative(SPEC_SOURCE_DIR, filePath)}`));
                    }

                    return suites;
                }
                else if (parts[3]) { // do not parse skipped files
                    console.warn(colors.cyan(` - skipped: ${path.relative(SPEC_SOURCE_DIR, filePath)}`));

                    return suites;
                }

                // add the test to the tracking object
                (suites[parts[1]] || (suites[parts[1]] = {
                    name: path.relative(SPEC_SOURCE_DIR, parts[1])
                }))[`${parts[2]}${parts[4].toUpperCase()}`] = filePath;

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

            // run tests using the consolidated test set as a guide
            async.mapLimit(suites, 10, function (test, next) {
                // load configuration JSON object if it is provided. We do this since this is not part of newman
                // standard API
                const started = Date.now(),

                    config = test.configJSON ? JSON.parse(fs.readFileSync(test.configJSON).toString()) : {},

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
                    const elapsed = Date.now() - started,

                        // mocha's own convention: hide the time for a fast suite, color it past medium/slow
                        duration = elapsed <= SLOW / 2 ? '' :
                            ` ${(elapsed > SLOW ? colors.red : colors.yellow)(`(${prettyms(elapsed)})`)}`;

                    if (err) {
                        console.info(`  ${colors.red(symbols.error)} ${colors.red(test.name)}${duration}`);
                        console.error(colors.red(`      ${err.name}: ${err.message}`));
                    }
                    else {
                        console.info(`  ${colors.green(symbols.ok)} ${colors.gray(test.name)}${duration}`);
                    }

                    // resolve (never reject) so one failing suite doesn't abort the rest of the batch
                    next(null, { name: test.name, err: err, summary: summary });
                });
            }, next);
        }
    ],

    /**
     * The integration test exit handler. Receives the error (if at all) from the integration test runner and exits
     * accordingly, displaying either a success message or a summary of every suite that failed.
     *
     * @param {?Error} err - Set only when the run never got to execute suites (e.g. no test files found).
     * @param {Array} results - An array of `{ name, err, summary }` objects, one per integration test suite run.
     * @returns {*}
     */
    function (err, results) {
        var failed;

        if (err) {
            console.error(colors.red(`\n${err.message}`));
        }
        else {
            failed = _.filter(results, 'err');

            if (_.isEmpty(failed)) {
                console.info(colors.green(`\n${results.length} integrations ok!\n`));
            }
            else {
                console.error(colors.red(`\n${failed.length}/${results.length} integrations failed:\n`));
                failed.forEach(function (result) {
                    console.error(colors.red(`  - ${result.name}: ${result.err.name}: ${result.err.message}`));
                });
                console.info('');
            }
        }

        // drop the interception seams, then stop the local fixture servers
        cleanup(function (cleanupError) {
            // report a cleanup failure, but never let it mask the test result
            cleanupError && console.error(cleanupError.stack || cleanupError);

            // exit once all the local servers are stopped
            exit(err || !_.isEmpty(failed) || process.exitCode ? 1 : 0, results);
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
