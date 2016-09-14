#!/usr/bin/env node
require('shelljs/global');
require('colors');

var Mocha = require('mocha'),
    recursive = require('recursive-readdir'),

    SPEC_SOURCE_DIR = './test/unit';

module.exports = function (exit) {
    // banner line
    console.info('Running unit tests using mocha...'.yellow.bold);

    var mocha = new Mocha();

    recursive(SPEC_SOURCE_DIR, function (err, files) {
        files.filter(function (file) {
            return (file.substr(-8) === '.test.js');
        }).forEach(function (file) {
            mocha.addFile(file);
        });

        // start the mocha run
        mocha.run(exit);
        mocha = null; // cleanup
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
