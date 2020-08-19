#!/usr/bin/env node

require('../lib/node-version-check'); // @note that this should not respect CLI --silent

const _ = require('lodash'),
    { Command } = require('commander'),
    waterfall = require('async/waterfall'),
    program = new Command(),
    version = require('../package.json').version,
    newman = require('../'),
    util = require('./util'),
    login = require('../lib/login'),
    config = require('../lib/config'),
    logout = require('../lib/logout'),

    RUN_COMMAND = 'run';

program
    .name('newman')
    .addHelpCommand(false)
    .version(version, '-v, --version');

// @note - Specify default options for commands in lib/config/defaults.js. This is done to give config-options from
// rc-file and environment higher priority than default options.

// The `run` command allows you to specify a collection to be run with the provided options.
program
    .command('run <collection>')
    .description('URL or path to a Postman Collection.')
    .usage('<collection> [options]')
    .option('-e, --environment <path>', 'Specify a URL or Path to a Postman Environment.')
    .option('-g, --globals <path>', 'Specify a URL or Path to a file containing Postman Globals.')
    // eslint-disable-next-line max-len
    .option('--folder <path>', 'Specify folder to run from a collection. Can be specified multiple times to run multiple folders', util.cast.memoize)
    .option('--working-dir <path>', 'The path of the directory to be used as the working directory')
    .option('--no-insecure-file-read', 'Prevents reading the files situated outside of the working directory')
    .option('-r, --reporters [reporters]', 'Specify the reporters to use for this run. (default: ["cli"])',
        util.cast.csvParse)
    .option('-n, --iteration-count <n>', 'Define the number of iterations to run.', util.cast.integer)
    .option('-d, --iteration-data <path>', 'Specify a data file to use for iterations (either json or csv).')
    .option('--sync-environment', 'Update the corresponding environment in Postman-Cloud with the ' +
        'resultant environment')
    .option('--export-environment <path>', 'Exports the environment to a file after completing the run.')
    .option('--export-globals <path>', 'Specify an output file to dump Globals before exiting.')
    .option('--export-collection <path>', 'Specify an output file to save the executed collection')
    .option('--postman-api-key <apiKey>', 'API Key used to load the resources from the Postman API.')
    .option('--postman-api-key-alias <alias>', 'Specify the alias of the API Key to fetch remote resources using it.')
    .option('--delay-request [n]', 'Specify the extent of delay between requests (milliseconds)', util.cast.integer)
    .option('--bail [modifiers]',
        'Specify whether or not to gracefully stop a collection run on encountering an error' +
        'and whether to end the run with an error based on the optional modifier.', util.cast.csvParse)
    .option('-x , --suppress-exit-code',
        'Specify whether or not to override the default exit code for the current run.')
    .option('--silent', 'Prevents newman from showing output to CLI.')
    .option('--disable-unicode',
        'Forces unicode compliant symbols to be replaced by their plain text equivalents')
    .option('--global-var <value>',
        'Allows the specification of global variables via the command line, in a key=value format',
        util.cast.memoizeKeyVal)
    .option('--env-var <value>',
        'Allows the specification of environment variables via the command line, in a key=value format',
        util.cast.memoizeKeyVal)
    .option('--color <value>', 'Enable/Disable colored output. (auto|on|off) (default: "auto")', util.cast.colorOptions)
    .option('--timeout [n]', 'Specify a timeout for collection run (in milliseconds)', util.cast.integer)
    .option('--timeout-request [n]', 'Specify a timeout for requests (in milliseconds).', util.cast.integer)
    .option('--timeout-script [n]', 'Specify a timeout for script (in milliseconds).', util.cast.integer)
    .option('--ignore-redirects', 'If present, Newman will not follow HTTP Redirects.')
    .option('-k, --insecure', 'Disables SSL validations.')
    .option('--ssl-client-cert-list <path>',
        'Specify the path to the Client SSL certificates configuration file to set certificates' +
        ' per URL/hostname (json).')
    .option('--ssl-client-cert <path>',
        'Specify the path to the Client SSL certificate. Supports .cert and .pfx files.')
    .option('--ssl-client-key <path>',
        'Specify the path to the Client SSL key (not needed for .pfx files)')
    .option('--ssl-client-passphrase <passphrase>',
        'Specify the Client SSL passphrase (optional, needed for passphrase protected keys).')
    .option('--ssl-extra-ca-certs <path>',
        'Specify additionally trusted CA certificates')
    .option('--verbose', 'Show detailed information of collection run and each request sent')
    .action((collection, command) => {
        let options;

        waterfall([
            // get the configuration from various sources
            (next) => { return config.get(command, { command: 'run' }, next); },

            // format the command-options
            (command, next) => {
                options = util.commanderToObject(command);

                // parse custom reporter options
                let reporterOptions = util.parseNestedOptions(program._originalArgs, '--reporter-', options.reporters);

                // Inject additional properties into the options object
                options.collection = collection;
                options.reporterOptions = reporterOptions._generic;
                options.reporter = _.transform(_.omit(reporterOptions, '_generic'), (acc, value, key) => {
                    acc[key] = _.assignIn(value, reporterOptions._generic); // overrides reporter options with _generic
                }, {});

                return next(null, options);
            },

            // start the run
            newman.run
        ], (err, summary) => {
            const runError = err || summary.run.error || summary.run.failures.length;

            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.friendly && console.error(`  ${err.friendly}\n`);
            }
            runError && !_.get(options, 'suppressExitCode') && process.exit(1);
        });
    });

program
    .command('login')
    .description('Store the API-Key along with an alias to it, to reference it in the following commands.')
    .action(() => {
        login((err) => {
            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.help && console.error(err.help);
                process.exit(1);
            }
        });
    });

program.command('logout')
    .description('Dereference an API-Key from its alias.')
    .action(() => {
        logout((err) => {
            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.help && console.error(err.help);
                process.exit(1);
            }
        });
    });

program.on('--help', function () {
    console.info('\nTo get available options for a command:');
    console.info('  newman <command> -h');
});

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
 * @param {Function} [callback] - The callback function invoked on the completion of execution.
 */
function run (argv, callback) {
    let error = null;

    if (argv[2] === RUN_COMMAND) {
        // omit custom nested options, otherwise commander will throw unknown options error
        program._originalArgs = argv;
        // cache original argv, required to parse nested options later.
        argv = util.omitNestedOptions(argv, '--reporter-');
    }

    try {
        program.parse(argv);
    }
    catch (err) {
        error = err;
    }

    // invoke callback if this is required as module, used in tests.
    if (callback) { return callback(error); }

    if (error) {
        // log error message and print help message.
        console.error(`error: ${error.message || error}\n`);
        program.help();
    }
}

// This hack has been added from https://github.com/nodejs/node/issues/6456#issue-151760275
// @todo: remove when https://github.com/nodejs/node/issues/6456 has been fixed
(Number(process.version[1]) >= 6) && [process.stdout, process.stderr].forEach((s) => {
    s && s.isTTY && s._handle && s._handle.setBlocking && s._handle.setBlocking(true);
});

// Run this script if this is a direct stdin.
!module.parent && run(process.argv);

// Export to allow debugging and testing.
module.exports = run;
