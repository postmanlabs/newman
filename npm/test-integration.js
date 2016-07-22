#!/usr/bin/env node
require('shelljs/global');
require('colors');

var fs = require('fs'),
    async = require('async'),
    newman = require('../index'),

    integrationTests = {},

    CONCURRENCY_LIMIT = 20,
    SPEC_SOURCE_DIR = './test/integration';

module.exports = function (exit) {
    // banner line
    console.log('Running Integration Tests...'.yellow.bold);

    fs.readdir(SPEC_SOURCE_DIR, function (err, files) {
        if (err) {
            console.error(err.message);
            return exit(1);
        }

        async.mapLimit(files, CONCURRENCY_LIMIT, function (file, asyncCallback) {
            var fileType,
                fileBaseName,
                fileParts = file.split('.');

            if (fileParts.length > 2 && fileParts[2] !== 'csv' && fileParts[1].indexOf('_') > -1) {
                // find the constituent parts of the file
                fileBaseName = fileParts[0];

                fileType = fileParts[1].split('_')[1];
                integrationTests[fileBaseName] = integrationTests[fileBaseName] || { abortOnError: true };

                integrationTests[fileBaseName][fileType] = SPEC_SOURCE_DIR + '/' + file;
            }

            asyncCallback();
        }, function (err) {
            if (err) {
                console.error(err.message);
                return exit(1);
            }

            var test;

            // run tests using the consolidated test set as a guide
            for (test in integrationTests) {
                if (integrationTests.hasOwnProperty(test) && integrationTests[test]) {
                    if (integrationTests[test].hasOwnProperty('data')) {
                        integrationTests[test].iterationData = integrationTests[test].data;

                        delete integrationTests[test].data;
                    }

                    newman.run(integrationTests[test], exit);
                }
            }
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(function (err, summary) {
    if (err) {
        throw err;
    }

    //console.log(summary);
    //assert(!summary.failures.length, `${summary.failures.length} failure${summary.failures.length > 1 ? 's' : ''}.`);
});
