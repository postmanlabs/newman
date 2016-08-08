#!/usr/bin/env node
require('../lib/node-version-check');

var _ = require('lodash'),

    cli = require('../lib/cli'),
    newman = require('../'),

    /**
     * Calls the appropriate Newman command
     *
     * @param options
     * @param callback
     */
    dispatch = function (options, callback) {
        var command = options.command;

        if (_.isFunction(newman[command])) {
            newman[command](options[command], callback);
        }
        else {
            callback(new Error('Oops, unsupported command: ' + options.command));
        }
    };

cli(process.argv.slice(2), 'newman', function (err, args) {
    if (err) {
        console.log(err.message || err);
        console.log('');
        err.help && console.log(err.help);  // will print out usage information.
        return;
    }
    dispatch(args, function (err) {
        if (err) {
            console.error(err);
            process.exit(_.get(args, 'run.suppressExitCode') ? 1 : 0);
        }
    });
});
