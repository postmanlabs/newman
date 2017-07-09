#!/usr/bin/env node
/**
 * @fileOverview
 * This sample code illustrates how to read a collection JSON file in NodeJS,run it using Newman and then log all the
 * unique URLs that were requested.
 */
var newman = require('../'), // require('newman')
    uniqueUrls = {}; // here we will maintain the unique URLs

// call newman.run to pass `options` object and listen to events
newman.run({ collection: require('./sample-collection.json') })
    .on('start', function (err, args) {
        if (err) { return; }

        console.info(`Running ${args.cursor.length} request(s) and ${args.cursor.cycles} iteration(s)`);
    })
    .on('request', function (err, args) {
        if (err) { return; }

        var url = args.request.url.toString();

        // store the URL string as key of the object so that we can quickly do hashing of unique URLs and add a counter
        if (uniqueUrls[url]) {
            uniqueUrls[url] += 1; // increment counter if the url was already called
        }
        else {
            uniqueUrls[url] = 1; // otherwise start a new counter
        }
    })
    .once('done', function (err) {
        var urls = Object.keys(uniqueUrls); // get list of all unique urls as an array from the object hash

        // now output the result to console
        console.info(`The collection run completed ${err ? 'with' : 'without'} error(s).`);
        console.info(`Total ${urls.length} unique URLs requested.`);

        urls.forEach(function (url) {
            console.info(`${uniqueUrls[url]}: ${url}`);
        });
    });
