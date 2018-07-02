#!/usr/bin/env node
require('shelljs/global');
require('colors');

var async = require('async'),
    _ = require('lodash'),
    path = require('path'),
    packity = require('packity'),
    expect = require('chai').expect,
    Mocha = require('mocha'),
    recursive = require('recursive-readdir'),

    /**
     * The source directory for system test specs.
     *
     * @type {String}
     */
    SPEC_SOURCE_DIR = './test/system',

    /**
     * Load a JSON from file synchronously, used as an alternative to dynamic requires.
     *
     * @param {String} file - The path to the JSON file to load from.
     * @returns {Object} - The parsed JSON object contained in the file at the provided path.
     * @throws {SyntaxError} - Throws an error if the provided JSON file is invalid.
     */
    loadJSON = function (file) {
        return JSON.parse(require('fs').readFileSync(path.join(__dirname, file)).toString());
    };

module.exports = function (exit) {
    // banner line
    console.info('\nRunning system tests...\n'.yellow.bold);

    async.series([

        /**
         * Enforces sanity checks on installed packages via packity.
         *
         * @param {Function} next - The callback function invoked when the package sanity check has concluded.
         * @returns {*}
         */
        function (next) {
            console.info('checking installed packages...\n');
            packity({ path: '.' }, packity.cliReporter({}, next));
        },

        /**
         * Runs system tests on SPEC_SOURCE_DIR using Mocha.
         *
         * @param {Function} next - The callback invoked to mark the completion of the test run.
         * @returns {*}
         */
        function (next) {
            console.info('\nrunning system specs using mocha...');

            var mocha = new Mocha();

            recursive(SPEC_SOURCE_DIR, function (err, files) {
                if (err) {
                    console.error(err);

                    return exit(1);
                }

                files.filter(function (file) {
                    return (file.substr(-8) === '.test.js');
                }).forEach(function (file) {
                    mocha.addFile(file);
                });

                // start the mocha run
                global.expect = expect; // for easy reference

                mocha.run(function (err) {
                    // clear references and overrides
                    delete global.expect;
                    next(err);
                });
                mocha = null; // cleanup
            });
        },

        /**
         * Execute nsp checks on project dependencies. In-program usage of nsp is a bit tricky as we have to emulate the
         * cli script's usage of internal nsp functions.
         *
         * @param {Function} next - The callback function invoked upon completion of the NSP check.
         * @returns {*}
         */
        function (next) {
            var nsp = require('nsp'),
                reporter = require('nsp/reporters').load('table'),
                pkg = loadJSON('../package.json'),
                nsprc = loadJSON('../.nsprc'),
                opts = _.merge(nsp.sanitizeParameters({}), {
                    offline: false,
                    pkg: _.merge({
                        dependencies: _.omit(pkg.dependencies, _.keys(nsprc.exclusions) || [])
                    }, _.pick(pkg, ['name', 'version', 'homepage', 'repository']))
                });

            console.info('processing nsp for security vulnerabilities...\n');

            // we do not pass full package for privacy concerns and also to add the ability to ignore exclude packages,
            // hence we customise the package before we send it
            nsp
                .check(opts)
                .then(function (result) {
                    // in case an nsp violation is found, we raise an error
                    if (!(result && result.data && result.data.length)) {
                        console.info('nsp ok!\n'.green);

                        return next();
                    }

                    console.error(reporter.check.success(result, opts));

                    return next(1);
                }, function (err) {
                    console.error('There was an error processing NSP!\n'.red + (err.message || err).gray + '\n\n' +
                        'Since NSP server failure is not a blocker for tests, tests are not marked as failure!');

                    next();
                })
                .catch(function (err) {
                    console.error('Error processing NSP!\n'.red + (err.message || err).gray);
                    next(err);
                });
        }
    ], exit);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
