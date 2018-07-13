#!/usr/bin/env node
require('shelljs/global');
require('colors');

var Mocha = require('mocha'),
    newman = require('../index'),
    expect = require('chai').expect,
    recursive = require('recursive-readdir'),

    /**
     * The directory containing library test specs.
     *
     * @type {String}
     */
    SPEC_SOURCE_DIR = './test/library';

module.exports = function (exit) {
    // banner line
    console.info('Running Library integration tests using mocha and shelljs...'.yellow.bold);

    var mocha = new Mocha({ timeout: 60000 });

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
        global.newman = newman;

        mocha.run(function (err) {
            // clear references and overrides
            delete global.expect;
            delete global.newman;
            exit(err);
        });
        mocha = null; // cleanup
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
