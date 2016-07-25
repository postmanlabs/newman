#!/usr/bin/env node
require('shelljs/global');
require('colors');

var fs = require('fs'),
    pathUtils = require('path'),
    _ = require('lodash'),
    path = require('path'),
    async = require('async'),
    expect = require('expect.js'),
    newman = require(path.join(__dirname, '..', 'index')),

    SPEC_SOURCE_DIR = './test/integration';

module.exports = function (exit) {
    // banner line
    console.log('Running integration tests using local newman...'.yellow.bold);

    async.waterfall([
        // get all files within the spec source directory
        fs.readdir.bind(fs, SPEC_SOURCE_DIR),

        // ensure that we forward only if files exist and has appropriate name conventions
        function (files, next) {
            next(null, _.reduce(files, function (suites, path) {
                // regex: [0:path, 1:test, 2:syntax, 3:skipped, 4: file-format]
                var parts = path.match(/(.+)\.postman_([^\.]+)(\.skip)?\.([^\.]{3,})$/i);

                if (!parts) { // if a spec file did not match the pattern, log warining and move on
                    return (console.warn(` - ignored: ${path}`.gray), suites);
                }
                else if (parts[3]) { // do not parse skipped files
                    return (console.warn(` - skipped: ${path}`.cyan), suites);
                }

                // add the test to the tracking object
                (suites[parts[1]] || (suites[parts[1]] = {
                    name: parts[1]
                }))[_.camelCase(`${parts[2]}-${parts[4]}`)] = pathUtils.join(SPEC_SOURCE_DIR, path);

                return suites;
            }, {}));
        },

        // execute each test on newman
        function (suites, next) {
            if (_.isEmpty(suites)) { // if no test files found, it is an error
                return next(new Error(`No test files found in ${SPEC_SOURCE_DIR}`));
            }

            console.log(`\nexecuting ${Object.keys(suites).length} tests in parallel...`);

            // run tests using the consolidated test set as a guide
            async.map(suites, function (test, next) {
                newman.run({
                    collection: test.collectionJson,
                    environment: test.environmentJson,
                    globals: test.globalsJson,
                    iterationData: test.dataCsv || test.dataJson,
                    abortOnError: true,
                    avoidRedirects: true
                }, next);
            }, next);
        }
    ], function (err, results) {
        try {
            !err && _.forEach(results, function (result) {
                expect(result.failures).to.eql(true);
            });
        }
        catch (e) { err = e; }

        if (!err) {
            console.log('integrations ok!'.green);
        }
        exit(err, results);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
