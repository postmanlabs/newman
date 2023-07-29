#!/usr/bin/env node

require('../lib/node-version-check'); // @note that this should not respect CLI --silent

const waterfall = require('async/waterfall'),
    { Command } = require('commander'),
    program = new Command(),
    version = require('../package.json').version,
    commands = require('../'),
    util = require('./util');

program
    .name('newman')
    .addHelpCommand(false)
    .version(version, '-v, --version');

Object.keys(commands).forEach(function (commandSetupFunction) {
    commands[commandSetupFunction](program);
});

program.addHelpText('after', `
To get available options for a command:
  newman <command> -h`);

// Warn on invalid command and then exits.
program.on('command:*', (command) => {
    console.error(`error: invalid command \`${command}\`\n`);
    program.help();
});

/**
 * Starts the script execution.
 * callback is required when this is required as a module in tests.
 *
 * @param {String[]} argv - Argument vector.
 * @param {?Function} callback - The callback function invoked on the completion of execution.
 */
function run (argv, callback) {
    waterfall([
        (next) => {
            // cache original argv, required to parse nested options later.
            program._originalArgs = argv;
            // omit custom nested options, otherwise commander will throw unknown options error
            next(null, util.omitNestedOptions(argv, '--reporter-'));
        },
        (args, next) => {
            let error = null;

            try {
                program.parse(args);
            }
            catch (err) {
                error = err;
            }
            next(error);
        },
        (next) => {
            // throw error if no argument is provided.
            next(program.args.length ? null : new Error('no arguments provided'));
        }
    ], (error) => {
        // invoke callback if this is required as module, used in tests.
        if (callback) { return callback(error); }

        // in case of an error, log error message and print help message.
        if (error) {
            console.error(`error: ${error.message || error}\n`);
            program.help();
        }
    });
}

// Run this script if this is a direct stdin.
!module.parent && run(process.argv);

// Export to allow debugging and testing.
module.exports = run;
