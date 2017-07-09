#!/usr/bin/env node
require('../lib/node-version-check'); // @note that this should not respect CLI --silent

var _ = require('lodash'),

    cli = require('../lib/cli'),
    newman = require('../'),

    /**
     * Calls the appropriate Newman command.
     *
     * @param {Object} options - The set of options passed via the CLI, including the command, and other details.
     * @param {Function} callback - The function called to mark the completion of command parsing.
     * @returns {*}
     */
    dispatch = function (options, callback) {
        var command = options.command;

        if (_.isFunction(newman[command])) {
            return newman[command](options[command], callback);
        }

        callback(new Error('Oops, unsupported command: ' + options.command));
    };

// This hack has been added from https://github.com/nodejs/node/issues/6456#issue-151760275
// @todo: remove when https://github.com/nodejs/node/issues/6456 has been fixed
(Number(process.version[1]) >= 6) && [process.stdout, process.stderr].forEach((s) => {
    s && s.isTTY && s._handle && s._handle.setBlocking && s._handle.setBlocking(true);
});

cli(process.argv.slice(2), 'newman', function (err, args) {
    if (err) {
        err.help && console.info(err.help + '\n'); // will print out usage information.
        console.error(err.message || err);
        return process.exit(1); // @todo: args do not arrive on CLI error hence cannot read `-x`
    }

    dispatch(args, function (err, summary) {
        var runError = err || summary.run.error || summary.run.failures.length;

        if (err) {
            err.help && console.info(err.help); // will print out usage information.
            console.error(err.message || err);
        }

        if (runError && !_.get(args, 'run.suppressExitCode')) {
            process.exit(1);
        }
    });
});
