#!/usr/bin/env node
require('shelljs/global');
require('colors');

var fs = require('fs'),
    pathUtils = require('path'),
    _ = require('lodash'),
    path = require('path'),
    async = require('async'),
    newman = require(path.join(__dirname, '..', 'index')),

    SPEC_SOURCE_DIR = './test/integration';

module.exports = function (exit) {
    // banner line
    console.info('Running integration tests using local newman as node module...'.yellow.bold);

    async.waterfall([
        // get all files within the spec source directory
        fs.readdir.bind(fs, SPEC_SOURCE_DIR),

        // ensure that we forward only if files exist and has appropriate name conventions
        function (files, next) {
            next(null, _.reduce(files, function (suites, path) {
                // regex: [0:path, 1:test, 2:syntax, 3:skipped, 4: file-format]
                var parts = path.match(/(.+)\.postman_([^\.]+)(\.skip)?\.([^\.]{3,})$/i);

                if (!parts) { // if a spec file did not match the pattern, log warning and move on
                    return (console.warn(` - ignored: ${path}`.gray), suites);
                }
                else if (parts[3]) { // do not parse skipped files
                    return (console.warn(` - skipped: ${path}`.cyan), suites);
                }

                // add the test to the tracking object
                (suites[parts[1]] || (suites[parts[1]] = {
                    name: parts[1]
                }))[`${parts[2]}${parts[4].toUpperCase()}`] = pathUtils.join(SPEC_SOURCE_DIR, path);

                return suites;
            }, {}));
        },

        // execute each test on newman
        function (suites, next) {
            if (_.isEmpty(suites)) { // if no test files found, it is an error
                return next(new Error(`No test files found in ${SPEC_SOURCE_DIR}`));
            }

            console.info(`\nexecuting ${Object.keys(suites).length} tests in parallel (might take a while)...\n`);

            // run tests using the consolidated test set as a guide
            async.map(suites, function (test, next) {
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
    ], function (err, results) {
        if (!err) {
            console.info(`\n${results.length} integrations ok!\n`.green);
        }
        else {
            console.error('\nintegration test failed:'.red);
            console.error(_.omit(err, ['stacktrace', 'stack']), { colors: true });
        }

        exit(err, results);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
