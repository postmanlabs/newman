#!/usr/bin/env node
require('shelljs/global');
require('colors');

var fs = require('fs'),
    _ = require('lodash'),
    pathUtils = require('path'),
    async = require('async'),
    recursive = require('recursive-readdir'),
    newman = require(pathUtils.join(__dirname, '..', 'index')),
    NYC = require('nyc'),

    echoServer = require('./server').createRawEchoServer(),
    redirectServer = require('./server').createRedirectServer(),

    COV_REPORT_PATH = '.coverage',

    LOCAL_TEST_ECHO_PORT = 4041,
    LOCAL_TEST_REDIRECT_PORT = 4042,

    /**
     * The source directory containing integration test collections and folders.
     *
     * @type {String}
     */
    SPEC_SOURCE_DIR = './test/integration';

module.exports = function (exit) {
    // banner line
    console.info('Running integration tests using local newman as node module...'.yellow.bold);

    var nyc = new NYC({
        hookRequire: true,
        reporter: ['text', 'lcov', 'text-summary', 'json'],
        reportDir: COV_REPORT_PATH,
        tempDirectory: COV_REPORT_PATH
    });

    test('-d', COV_REPORT_PATH) && rm('-rf', COV_REPORT_PATH);
    mkdir('-p', COV_REPORT_PATH);

    nyc.reset();
    nyc.wrap();

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
                var parts = path.match(/(.+)\.postman_([^.]+)(\.skip)?\.([^.]{3,})$/i);

                if (!parts) { // if a spec file did not match the pattern, log warning and move on
                    return (console.warn(` - ignored: ${path}`.gray), suites);
                }
                else if (parts[3]) { // do not parse skipped files
                    return (console.warn(` - skipped: ${path}`.cyan), suites);
                }

                // add the test to the tracking object
                (suites[parts[1]] || (suites[parts[1]] = {
                    name: parts[1]
                }))[`${parts[2]}${parts[4].toUpperCase()}`] = path;

                return suites;
            }, {}));
        },

        /**
         * Start local server used in collections
         *   - echoServer = custom HTTP method, body with GET
         *   - redirectServer = protocol profile behavior
         *
         * @param {Object} suites - An set of tests, arranged by test group names as keys.
         * @param {Function} next - A callback function whose invocation marks the end of the integration test run.
         * @returns {*}
         */
        function (suites, next) {
            // start echoServer first
            echoServer.listen(LOCAL_TEST_ECHO_PORT, function (err) {
                if (err) { return next(err); }
                // start redirectServer once echoServer is started
                redirectServer.listen(LOCAL_TEST_REDIRECT_PORT, function (err) {
                    next(err, suites);
                });
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

            nyc.reset();
            nyc.wrap();

            // run tests using the consolidated test set as a guide
            async.mapLimit(suites, 10, function (test, next) {
                console.info(` - ${test.name}`);

                // load configuration JSON object if it is provided. We do this since this is not part of newman
                // standard API
                var config = test.configJSON ? JSON.parse(fs.readFileSync(test.configJSON).toString()) : {};

                newman.run(_.merge({
                    collection: test.collectionJSON,
                    environment: test.environmentJSON,
                    globals: test.globalsJSON,
                    iterationData: test.dataCSV || test.dataJSON,
                    abortOnFailure: true
                }, config.run), function (err, summary) {
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
            console.info(`\n${results.length} integrations ok!\n`.green);
        }
        else {
            console.error('\nintegration test failed:'.red);
            console.error(_.omit(err, ['stacktrace', 'stack']), { colors: true });
        }

        nyc.writeCoverageFile();
        nyc.report();
        nyc.checkCoverage({
            statements: 50,
            branches: 25,
            functions: 50,
            lines: 50
        });

        // destroy echoServer
        echoServer.destroy(function () {
            // destroy redirectServer
            redirectServer.destroy(function () {
                // exit once both the local server are stopped
                exit(err || process.exitCode ? 1 : 0, results);
            });
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
