#!/usr/bin/env node
/**
 * @fileOverview This sample code illustrates how one can read all collection files within a directory and run them
 * in parallel.
 */
var newman = require('../'), // require('newman')
    fs = require('fs');

fs.readdir('./examples', function (err, files) {
    if (err) { throw err; }

    // we filter all files with JSON file extension
    files = files.filter(function (file) {
        return (/^((?!(package(-lock)?))|.+)\.json/).test(file);
    });

    // now we iterate on each file name and call newman.run using each file name
    files.forEach(function (file) {
        newman.run({
            // we load collection using require. for better validation and handling
            // JSON.parse could be used
            collection: require(`${__dirname}/${file}`)
        }, function (err) {
            // finally, when the collection executes, print the status
            console.info(`${file}: ${err ? err.name : 'ok'}!`);
        });
    }); // the entire flow can be made more elegant using `async` module
});
