#!/usr/bin/env node
/**
 * @fileOverview
 * This sample code illustrates how to read a collection JSON file in NodeJS and run it using Newman
 */
var newman = require('../'); // require('newman')

// call newman.run to pass `options` object and wait for callback
newman.run({
    collection: require('./sample-collection.json'),
    reporters: 'cli'
}, function (err) {
    if (err) { throw err; }
    console.info('collection run complete!');
});
