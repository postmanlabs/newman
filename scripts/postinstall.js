#!/usr/bin/env node

var npm = require('npm');

npm.load({}, function (err) {
    if (err) {
        console.log('Error installing "jsdom"');
        throw err;
    }
    if (/v0\.[0-9]+\.[0-9]+/.test(process.version)) {
        // v0.x.x
        npm.commands.install(['jsdom@3.1.2'], function (err) {
            if (err) {
                console.log('Could not install "jsdom"');
                throw err; // Will cause the script to exit with a non zero code
            }
            console.log('You are using node ' + process.version +
                ' which requires an older version of "jsdom". Consider updating to node v4.0.0+.');
        });
    }
    else {
        npm.commands.install(['jsdom@6.3.0'], function (err) {
            if (err) {
                console.log('Could not install "jsdom"');
                throw err; // Will cause the script to exit with a non zero code
            }
        });
    }
});