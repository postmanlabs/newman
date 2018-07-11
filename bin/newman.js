#!/usr/bin/env node

require('../lib/node-version-check'); // @note that this should not respect CLI --silent

const _ = require('lodash'),
    Command = require('commander').Command,
    version = require('../package.json').version,
    newman = require('../'),
    util = require('./util'),

    /**
     * Commander coercion to process stringified numbers into integers.
     * Perform safety checks, and return the result.
     *
     * @param {String} arg - The stringified number argument.
     * @returns {Number} - The supplied argument, casted to an integer.
     */
    integer = (arg) => {
        const num = Number(arg);

        if (!_.isSafeInteger(num) || num <= 0) {
            throw new Error('The value must be a positive integer.');
        }

        return num.valueOf();
    },

    /**
     *  Commander coercion for collecting global key=value variables
     *
     * --global-var "foo=bar" --global-var "alpha=beta"
     *
     * @param {String} val - The argument provided to `--global-var`.
     * @param {Array} memo - The array that is populated by key value pairs.
     * @returns {Array} - [{key, value}] - The object representation of the current CLI variable.
     */
    memoize = (val, memo) => {
        let arg,
            eqIndex = val.indexOf('='),
            hasEq = eqIndex !== -1;

        // This is done instead of splitting by `=` to avoid chopping off `=` that could be present in the value
        arg = hasEq ? {
            key: val.slice(0, eqIndex),
            value: val.slice(eqIndex + 1)
        } : {
            key: val,
            value: undefined
        };

        memo.push(arg);

        return memo;
    },

    /**
     *  Commander coercion for converting a comma separated string to an array.
     *
     * eg. item1,item2
     *
     * @param {String} list - The comma separated string.
     * @returns {Array} - [item1, item2] - The array representation of the passed string.
     */
    csvParse = (list) => {
        return _.split(list, ',');
    },

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
    .option('-r, --reporters [reporters]', 'Specify the reporters to use for this run.', csvParse, ['cli'])
    .option('-n, --iteration-count <n>', 'Define the number of iterations to run.', integer)
    .option('-d, --iteration-data <path>', 'Specify a data file to use for iterations (either json or csv).')
    .option('--export-environment <path>', 'Exports the environment to a file after completing the run.')
    .option('--export-globals <path>', 'Specify an output file to dump Globals before exiting.')
    .option('--export-collection <path>', 'Specify an output file to save the executed collection')
    .option('--delay-request [n]', 'Specify the extent of delay between requests (milliseconds)', integer, 0)
    .option('--bail [modifiers]',
        'Specify whether or not to gracefully stop a collection run on encountering an error' +
        'and whether to end the run with an error based on the optional modifier.',
        csvParse)
    .option('-x , --suppress-exit-code',
        'Specify whether or not to override the default exit code for the current run.')
    .option('--silent', 'Prevents newman from showing output to CLI.')
    .option('--disable-unicode',
        'Forces unicode compliant symbols to be replaced by their plain text equivalents')
    .option('--global-var <value>',
        'Allows the specification of global variables via the command line, in a key=value format', memoize, [])
    .option('--color', 'Force colored output (for use in CI environments).')
    .option('--no-color', 'Disable colored output.', false)
    .option('--timeout [n]', 'Specify a timeout for collection run (in milliseconds)', integer, 0)
    .option('--timeout-request [n]', 'Specify a timeout for requests (in milliseconds).', integer, 0)
    .option('--timeout-script [n]', 'Specify a timeout for script (in milliseconds).', integer, 0)
    .option('--ignore-redirects', 'If present, Newman will not follow HTTP Redirects.')
    .option('-k, --insecure', 'Disables SSL validations.')
    .option('--ssl-client-cert <path>',
        'Specify the path to the Client SSL certificate. Supports .cert and .pfx files.')
    .option('--ssl-client-key <path>',
        'Specify the path to the Client SSL key (not needed for .pfx files)')
    .option('--ssl-client-passphrase <path>',
        'Specify the Client SSL passphrase (optional, needed for passphrase protected keys).')
    .action((collection, command) => {
        let options = util.commanderToObject(command),

            // parse custom reporter options
            reporterOptions = util.parseNestedOptions(process.argv, '--reporter-', options.reporters);

        // Inject additional properties into the options object
        options.collection = collection;
        options.reporterOptions = reporterOptions._generic;
        options.reporter = _.transform(_.omit(reporterOptions, '_generic'), (acc, value, key) => {
            acc[key] = _.assignIn(value, reporterOptions._generic); // overrides reporter options with _generic
        }, {});

        newman.run(options, function (err, summary) {
            const runError = err || summary.run.error || summary.run.failures.length;

            if (err) {
                err.help && console.info(err.help); // will print out usage information.
                console.error(err.message || err);
            }

            if (runError && !_.get(options, 'suppressExitCode')) {
                process.exit(1);
            }
        });
    });

// Warn on invalid command and then exits.
program.on('command:*', (command) => {
    console.warn('\nNewman: Invalid command `' + command + '`.\n\n' +
        'Example:\n  newman run my-api.json -e variables.json\n\n' +
        'For more information, run:\n  newman --help\n');
    process.exit(0);
});

try {
    // Omit custom nested options, otherwise commander will throw unknown options error
    const args = util.omitNestedOptions(process.argv, '--reporter-');

    program.parse(args);
}
catch (error) {
    program.help();
}

// If no argument is passed, Log help and then exits.
if (program.args.length === 0) {
    program.help();
}
