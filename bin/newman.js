#!/usr/bin/env node

require('../lib/node-version-check'); // @note that this should not respect CLI --silent

const _ = require('lodash'),
    Command = require('commander').Command,
    version = require('../package.json').version,
    newman = require('../'),

    /**
     * A CLI parser helper to process stringified numbers into integers, perform safety checks, and return the result.
     *
     * @param {String} arg - The stringified number argument pulled from the CLI arguments list.
     * @returns {Number} - The supplied argument, casted to an integer.
     */
    Integer = (arg) => {
        const num = Number(arg);

        if (!_.isSafeInteger(num) || num <= 0) {
            throw new Error('The value must be a positive integer.');
        }

        return num.valueOf();
    },

    /**
     *  used for collecting global key=value variables supplied through command line
     *
     * --global-var "foo=bar" --global-var "alpha=beta"
     *
     * @param {String} val - The argument provided to `--global-var`.
     * @param {Array} memo - The array that is populated by key value pairs.
     * @returns {Array} - [{key, value}] - The object representation of the current CLI variable.
     */
    collect = (val, memo) => {
        let arg,
            eqIndex = val.indexOf('='),
            hasEq = eqIndex !== -1;

        // This is done instead of splitting by `=` to avoid chopping off `=` that could be present in the value
        arg = hasEq ? { key: val.slice(0, eqIndex), value: val.slice(eqIndex + 1) } :
            { key: val, value: undefined };
        memo.push(arg);

        return memo;
    },

    /**
     *  used for converting a comma separated string to an array.
     *
     * eg. item1,item2
     *
     * @param {String} list - The comma separated string.
     * @returns {Array} - [item1, item2] - The array representation of the passed string.
     */
    arrayCollect = (list) => {
        return _.split(list, ',');
    },

    /**
     * Logs the message passed as a warning and then exits.
     *
     * @param {String} msg - The message to be logged.
     *
     */
    customError = (msg) => {
        console.warn(msg);
        process.exit(0);
    },

    /**
     * Separates reporter specific arguments from the rest.
     *
     * @param {Array} allArgs - An array of strings, each corresponding to a CLI argument.
     * @returns {Object} - An object with reporter and regular argument key-values.
     */
    separateReporterArgs = (allArgs) => {
        let reporterArgs = [],
            args = [],
            arg,
            eqIndex,
            i;

        // Separate the reporter arguments from the rest
        for (i = 0; i < allArgs.length; i++) {
            arg = allArgs[i];

            if (!_.startsWith(arg, '--reporter-')) {
                args.push(arg);
                continue;
            }

            eqIndex = arg.indexOf('=');

            if (eqIndex !== -1) {
                // Split the attribute if its like key=value
                reporterArgs.push(arg.slice(0, eqIndex), arg.slice(eqIndex + 1));
            }
            else if (allArgs[i + 1] && !_.startsWith(allArgs[i + 1], '-')) {
                // Also push the next parameter if it's not an option.
                reporterArgs.push(arg, allArgs[++i]);
            }
            else {
                reporterArgs.push(arg);
            }
        }

        return {
            reporter: reporterArgs,
            argv: args
        };
    },

    /**
     * Parses the variadic arguments for reporters.
     *
     * @param {Array} args - The array of passed CLI arguments.
     * @param {Array} reporters - A list of reporters used within the current run.
     * @returns {Object} - An object of parsed reporter options.
     */
    reporter = (args, reporters) => {
        let parsed = {
                generic: {}
            },
            name,
            path,
            arg,
            i;

        // ensure that whatever reporter is provided a blank options object object is forwarded
        _.forEach(reporters, (reporter) => { parsed[reporter] = {}; });

        for (i = 0; i < args.length; i++) {
            // Remove trailing whitespace
            arg = _.trim(args[i]);

            // Remove "--reporter-"
            arg = arg.replace('--reporter-', '');

            name = _.split(arg, '-', 1)[0]; // Reporter Name.

            // if we have a valid reporter, the path should be the <name>.camelCaseOfTheRest
            // otherwise, we add it to the generic options.
            path = _.includes(reporters, name) ?
                [name, _.camelCase(arg.replace(name + '-', ''))].join('.') :
                ['generic', _.camelCase(arg)].join('.');

            // If the next arg is an option, set the current arg to true,
            // otherwise set it to the next arg.
            _.set(parsed, path, (!args[i + 1] || _.startsWith(args[i + 1], '-')) ? true : args[++i]);
        }

        return parsed;
    },

    /**
     * Formats the options to the required format for the dispatch function.
     *
     * @param {Object} options - The options populated through CLI.
     * @returns {Object} - An object of formatted options.
     */
    formatOptions = (options) => {
        const command = options.name();
        let optionsObj, prop;

        optionsObj = {
            [command]: {}
        };
        optionsObj.command = command;
        optionsObj.version = options.parent._version || false;

        /* Extract options selected from command instance.
         * Exclude command's private `_` variables and other objects
         */
        for (prop of Object.keys(options)) {
            if (!_.startsWith(prop, '_') && !_.includes(['commands', 'options', 'parent'], prop)) {
                optionsObj[command][prop] = options[prop];
            }
        }

        return optionsObj;
    },

    /**
     * Calls the appropriate Newman command.
     *
     * @param {Object} options - The set of options passed via the CLI, including the command, and other details.
     * @param {Function} callback - The function called to mark the completion of command parsing.
     * @returns {*}
     */
    dispatch = (options, callback) => {
        const command = options.command;

        if (_.isFunction(newman[command])) {
            return newman[command](options[command], callback);
        }

        callback(new Error('Oops, unsupported command: ' + options.command));
    },

    /**
     * An object with reporter and regular arguments key-value
     *
     * @const {Object} rawArgs
     * @property {Object} rawArgs.reporter - An object with `--reporter-` arguments
     * @property {Object} rawArgs.argv - All `process.argv` without reporter arguments
     */
    rawArgs = separateReporterArgs(process.argv),

    // Commander Instance
    program = new Command();

// This hack has been added from https://github.com/nodejs/node/issues/6456#issue-151760275
// @todo: remove when https://github.com/nodejs/node/issues/6456 has been fixed
(Number(process.version[1]) >= 6) && [process.stdout, process.stderr].forEach((s) => {
    s && s.isTTY && s._handle && s._handle.setBlocking && s._handle.setBlocking(true);
});

program
    .version(version, '-v, --version')
    .name('newman');

program
    .command('run <collection>')
    .description('URL or path to a Postman Collection.')
    .usage('<collection> [options]')
    .option('-e, --environment <path>', 'Specify a URL or Path to a Postman Environment.')
    .option('-g, --globals <path>', 'Specify a URL or Path to a file containing Postman Globals.')
    .option('--folder <path>', 'Run a single folder from a collection.')
    .option('-r, --reporters [reporters]', 'Specify the reporters to use for this run.', 'cli')
    .option('-n, --iteration-count <n>', 'Define the number of iterations to run.', Integer)
    .option('-d, --iteration-data <path>', 'Specify a data file to use for iterations (either json or csv).')
    .option('--export-environment <path>', 'Exports the environment to a file after completing the run.')
    .option('--export-globals <path>', 'Specify an output file to dump Globals before exiting.')
    .option('--export-collection <path>', 'Specify an output file to save the executed collection')
    .option('--delay-request [n]', 'Specify the extent of delay between requests (milliseconds)', Integer, 0)
    .option('--bail [modifiers]',
        'Specify whether or not to gracefully stop a collection run on encountering an error' +
        'and whether to end the run with an error based on the optional modifier.',
        arrayCollect)
    .option('-x , --suppress-exit-code',
        'Specify whether or not to override the default exit code for the current run.')
    .option('--silent', 'Prevents newman from showing output to CLI.')
    .option('--disable-unicode',
        'Forces unicode compliant symbols to be replaced by their plain text equivalents')
    .option('--global-var <value>',
        'Allows the specification of global variables via the command line, in a key=value format', collect, [])
    .option('--color', 'Force colored output (for use in CI environments).')
    .option('--no-color', 'Disable colored output.', false)
    .option('--timeout [n]', 'Specify a timeout for collection run (in milliseconds)', Integer, 0)
    .option('--timeout-request [n]', 'Specify a timeout for requests (in milliseconds).', Integer, 0)
    .option('--timeout-script [n]', 'Specify a timeout for script (in milliseconds).', Integer, 0)
    .option('--ignore-redirects', 'If present, Newman will not follow HTTP Redirects.')
    .option('-k, --insecure', 'Disables SSL validations.')
    .option('--ssl-client-cert <path>',
        'Specify the path to the Client SSL certificate. Supports .cert and .pfx files.')
    .option('--ssl-client-key <path>',
        'Specify the path to the Client SSL key (not needed for .pfx files)')
    .option('--ssl-client-passphrase <path>',
        'Specify the Client SSL passphrase (optional, needed for passphrase protected keys).')
    .action((collection, command) => {
        let options, reporterArgs;

        // Handle the reporter Names
        _.isString(command.reporters) && (command.reporters = command.reporters.split(','));

        // Populate the reporter args as well.
        reporterArgs = reporter(rawArgs.reporter, command.reporters);
        command.reporterOptions = reporterArgs.generic;
        command.reporter = _.transform(_.omit(reporterArgs, 'generic'), (acc, value, key) => {
            acc[key] = _.assignIn(value, reporterArgs.generic);
        }, {});

        command.collection = collection;

        options = formatOptions(command);

        dispatch(options, (err, summary) => {
            const runError = err || summary.run.error || summary.run.failures.length;

            if (err) {
                err.help && console.info(err.help); // will print out usage information.
                console.error(err.message || err);
            }

            if (runError && !_.get(options, 'run.suppressExitCode')) {
                process.exit(1);
            }
        });
    });

// Handle invalid commands
program.on('command:*', (command) => {
    customError('\nNewman: Invalid command `' + command + '`.\n\n' +
        'Example:\n  newman run my-api.json -e variables.json\n\n' +
        'For more information, run:\n  newman --help\n');
});

try {
    program.parse(rawArgs.argv);
}
catch (error) {
    program.help();
}

// If no argument is passed, Log help and then exits.
if (program.args.length === 0) {
    program.help();
}
