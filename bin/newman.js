#!/usr/bin/env node

require('../lib/node-version-check'); // @note that this should not respect CLI --silent

const _ = require('lodash'),
    { Command } = require('commander'),
    program = new Command(),
    version = require('../package.json').version,
    newman = require('../'),
    login = require('../lib/login'),
    logout = require('../lib/logout'),
    util = require('./util'),

    RUN_COMMAND = 'run',
    DEFAULT_USER = 'default';

program
    .name('newman')
    .addHelpCommand(false)
    .version(version, '-v, --version');

// The `run` command allows you to specify a collection to be run with the provided options.
program
    .command('run <collection>')
    .description('URL or path to a Postman Collection.')
    .usage('<collection> [options]')
    .option('-e, --environment <path>', 'Specify a URL or Path to a Postman Environment.')
    .option('-g, --globals <path>', 'Specify a URL or Path to a file containing Postman Globals.')
    // eslint-disable-next-line max-len
    .option('--folder <path>', 'Specify folder to run from a collection. Can be specified multiple times to run multiple folders', util.cast.memoize, [])
    .option('--working-dir <path>', 'The path of the directory to be used as the working directory')
    .option('--no-insecure-file-read', 'Prevents reading the files situated outside of the working directory')
    .option('-r, --reporters [reporters]', 'Specify the reporters to use for this run.', util.cast.csvParse, ['cli'])
    .option('-n, --iteration-count <n>', 'Define the number of iterations to run.', util.cast.integer)
    .option('-d, --iteration-data <path>', 'Specify a data file to use for iterations (either json or csv).')
    .option('--export-environment <path>', 'Exports the environment to a file after completing the run.')
    .option('--export-globals <path>', 'Specify an output file to dump Globals before exiting.')
    .option('--export-collection <path>', 'Specify an output file to save the executed collection')
    .option('--postman-api-key <apiKey>', 'API Key used to load the resources from the Postman API.')
    .option('--delay-request [n]', 'Specify the extent of delay between requests (milliseconds)', util.cast.integer, 0)
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
        util.cast.memoizeKeyVal, [])
    .option('--env-var <value>',
        'Allows the specification of environment variables via the command line, in a key=value format',
        util.cast.memoizeKeyVal, [])
    .option('--color <value>', 'Enable/Disable colored output. (auto|on|off)', util.cast.colorOptions, 'auto')
    .option('--timeout [n]', 'Specify a timeout for collection run (in milliseconds)', util.cast.integer, 0)
    .option('--timeout-request [n]', 'Specify a timeout for requests (in milliseconds).', util.cast.integer, 0)
    .option('--timeout-script [n]', 'Specify a timeout for script (in milliseconds).', util.cast.integer, 0)
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
        let options = util.commanderToObject(command),

            // parse custom reporter options
            reporterOptions = util.parseNestedOptions(program._originalArgs, '--reporter-', options.reporters);

        // Inject additional properties into the options object
        options.collection = collection;
        options.reporterOptions = reporterOptions._generic;
        options.reporter = _.transform(_.omit(reporterOptions, '_generic'), (acc, value, key) => {
            acc[key] = _.assignIn(value, reporterOptions._generic); // overrides reporter options with _generic
        }, {});

        newman.run(options, function (err, summary) {
            const runError = err || summary.run.error || summary.run.failures.length;

            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.friendly && console.error(`  ${err.friendly}\n`);
            }
            runError && !_.get(options, 'suppressExitCode') && process.exit(1);
        });
    });

program
    .command('login [alias]')
    .description('Name of the user for local reference. If not specified, uses default profile.')
    .usage('[alias] [options]')
    .option('-p, --passkey', 'Provide the passkey to securely store the API Key')
    .action((alias, command) => {
        let options = util.commanderToObject(command);

        options.alias = alias || DEFAULT_USER;
        login(options, (err) => {
            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.help && console.error(err.help);
                process.exit(1);
            }
        });
    });

program
    .command('logout [alias]')
    .description('Name of the user. If not specified, assumes default user.')
    .usage('[alias]')
    .action((alias) => {
        alias = alias || DEFAULT_USER;

        logout(alias, (err) => {
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
