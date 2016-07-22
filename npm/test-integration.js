#!/usr/bin/env node
require('shelljs/global');
require('colors');

var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    async = require('async'),
    expect = require('expect.js'),
    newman = require(path.join(__dirname, '..', 'index')),

    CONCURRENCY_LIMIT = 20,
    SPEC_SOURCE_DIR = './test/integration';

module.exports = function (exit) {
    // banner line
    console.log('Running Integration Tests...'.yellow.bold);

    async.waterfall([
        function (next) {
            fs.readdir(SPEC_SOURCE_DIR, function (err, files) {
                if (err) {
                    return exit(err);
                }
                if (_.isEmpty(files)) {
                    return exit(new Error(`No test files found in ${SPEC_SOURCE_DIR}`));
                }

                next(null, files);
            });
        },
        function (files, next) {
            var compiledTests = {};

            async.mapLimit(files, CONCURRENCY_LIMIT, function (file, asyncCallback) {
                var fileType,
                    fileBaseName,
                    fileParts = file.split('.');

                if (fileParts.length > 2 && fileParts[2] !== 'skip' && fileParts[1].indexOf('_') > -1) {
                    // find the constituent parts of the file
                    fileBaseName = fileParts[0];

                    fileType = fileParts[1].split('_')[1];

                    if (_.isEmpty(compiledTests[fileBaseName])) {
                        compiledTests[fileBaseName] = { abortOnError: true, avoidRedirects: true };
                    }

                    compiledTests[fileBaseName][fileType] = SPEC_SOURCE_DIR + '/' + file;
                }

                asyncCallback(null, compiledTests);
            }, next);
        },
        function (compiledTests, next) {
            var integrationTests = compiledTests[0],
                collections = Object.keys(integrationTests);

            console.log(`Running sanity tests for ${collections.length} collections...`.yellow.bold);

            // run tests using the consolidated test set as a guide
            async.mapLimit(collections, CONCURRENCY_LIMIT, function (test, testCallback) {
                // check if the current collection object actually contains a valid collection path
                if (integrationTests[test].hasOwnProperty('collection')) {
                    // map `data` in the original collection set to `iterationData`
                    if (integrationTests[test].hasOwnProperty('data')) {
                        integrationTests[test].iterationData = integrationTests[test].data;

                        delete integrationTests[test].data;
                    }

                    newman.run(integrationTests[test], testCallback);
                }
            }, next);
        }
    ], exit);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(function (err, summary) {
    if (err) {
        throw err;
    }

    _.forEach(summary, function (result) {
        expect(_.isEmpty(result.failures)).to.be(true);
    });

    console.log(`${summary.length} collections were tested successfully.`);
});
