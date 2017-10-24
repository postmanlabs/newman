require('colors');

var _ = require('lodash'),
    program = require('commander'),
    async = require('async'),
    colors = require('colors'),
    version = require('../../package.json').version,

    /**
     * Separates reporter specific arguments from the rest.
     *
     * @todo Figure out a better way! (Or submit a PR to argparse).
     * @param {Array} allArgs - An array of strings, each coresponding to a CLI argument.
     * @returns {Object} - An object with reporter and regular argument key-values.
     */
    separateReporterArgs = (allArgs) => {
        var reporterArgs = [],
            args = [],

            i;

        // Separate the reporter arguments from the rest
        for (i = 0; i < allArgs.length; i++) {
            if (_.startsWith(allArgs[i], '--reporter-')) {
                reporterArgs.push(allArgs[i]);

                // Also push the next parameter if it's not an option.
                allArgs[i + 1] && !_.startsWith(allArgs[i + 1], '-') && reporterArgs.push(allArgs[++i]);
            }
            else {
                args.push(allArgs[i]);
            }
        }
        return {
            reporter: reporterArgs,
            argv: args
        };
    },

    /**
     * A CLI parser helper to process stringified numbers into integers, perform safety checks, and return the result.
     *
     * @param {String} arg - The stringified number argument pulled from the CLI arguments list.
     * @returns {Number} - The supplied argument, casted to an integer.
     */
    Integer = (arg) => {
        var num = Number(arg);

        if (!_.isSafeInteger(num)) {
            throw new Error('The value must be an integer.');
        }

        return num.valueOf();
    },


    /**
     * Creates a parser that can be used to parse out HTTP specific request options.
     *
     * Adds http request options to the common commander program instance.
     * @private
     */

    _request = () => {
        program
            .option('--timeout-request <n>', 'Specify a timeout for requests (in milliseconds).', parseInt)
            .option('--timeout-script <n>', 'Specify a timeout for script (in milliseconds).', parseInt)
            .option('--ignore-redirects', 'If present, Newman will not follow HTTP Redirects.')
            .option('-k, --insecure', 'Disables SSL validations.')
            .option('--ssl-client-cert <path>', 'Specify the path to the Client SSL certificate. Supports .cert and .pfx files.')
            .option('--ssl-client-key <path>', 'Specify the path to the Client SSL key (not needed for .pfx files)')
            .option('--ssl-client-passphrase <path>', 'Specify the Client SSL passphrase (optional, needed for passphrase protected keys).');
    },

    /**
     * Creates a parser capable of handling options typically given to "newman run" command.
     *
     *  Adds run command options to the common commander program instance.
     * @private
     */

    _run = () => {
        /**
             * Parses `=` separated key-value pairs into Postman variable list like arrays. `=` characters in values are
             * also supported.
             *
             * @param {String} arg - The argument provided to `--global-var`.
             * @returns {{key, value}} - The object representation of the current CLI variable.
             * @throws {Error} - An error is thrown for arguments that are not in the form foo=bar.
        */


        /* 
            used for collecting global key=value variables supplied through command line
        */
        function collect (val, memo) {
            memo.push(val);
            return memo;
        }

        program
            .command('run <collection>')
            .version(version)
            .description('URL or path to a Postman Collection.')
            .option('-e, --environment <path>', 'Specify a URL or Path to a Postman Environment.')
            .option('-g, --globals <path>', 'Specify a URL or Path to a file containing Postman Globals.')
            .option('--folder <path>', 'Run a single folder from a collection.')
            .option('-r, --reporters [reporters]', 'Specify the reporters to use for this run.', 'cli')
            .option('-n, --iteration-count <n>', 'Define the number of iterations to run.', parseInt)
            .option('-d, --iteration-data <path>', 'Specify a data file to use for iterations (either json or csv).')
            .option('--export-environment <path>', 'Exports the environment to a file after completing the run.')
            .option('--export-globals <path>', 'Specify an output file to dump Globals before exiting.')
            .option('--export-collection', 'Specify an output file to save the executed collection')
            .option('--delay-request [n]', 'Specify the extent of delay between requests (milliseconds)', parseInt, 0)
            .option('--bail', 'Specify whether or not to gracefully stop a collection run on encountering the first error', false)
            .option('-x , --suppress-exit-code', 'Specify whether or not to override the default exit code for the current run', false)
            .option('--silent', 'Prevents newman from showing output to CLI', false)
            .option('--disable-unicode', 'Forces unicode compliant symbols to be replaced by their plain text equivalents')
            .option('--global-var [value]', 'Allows the specification of global variables via the command line, in a key=value format', collect, [])
            // commander had some issue with flags starting with --no, thus camelCased 
            // resolved https://github.com/tj/commander.js/pull/709
            .option('--no-color', 'Disable colored output.')
            .option('--color', 'Force colored output (for use in CI environments).')
            .action(function (collection, options) {
                program.environment = options.environment;
                program.globals = options.globals;
                program.folder = options.folder;
                program.reporters = options.reporters;
                program.iterationCount = options.iterationCount;
                program.exportEnvironment = options.exportEnvironment;
                program.exportGlobals = options.exportGlobals;
                program.exportCollection = options.exportCollection;
                program.delayRequest = options.delayRequest;
                program.bail = options.bail;
                program.suppressExitCode = options.suppressExitCode;
                program.silent = options.silent;
                program.disableUnicode = options.disableUnicode;
                program.globalVar = options.globalVar;
                program.color = options.color;
                program.noColor = !options.color;
            })
            .parse(process.argv);

    },

    /**
     * A CLI helper to display various commands avaialbe, in cases where no valid command matches are found.
     *
     * @returns {ArgumentParser} - An ArgumentParser instance with the commands wrapped in.
     */
    commands = () => {
        _request();
        _run();
    },

    /**
     * Parses the variadic arguments for reporters.
     *
     * @param {Array} args - The array of passed CLI arguments.
     * @param {Array} reporters - A list of reporters used within the current run.
     * @returns {Object} - An object of parsed reporter options.
     */
    reporter = function (args, reporters) {
        var parsed = {
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
     * Loads the raw options for Newman, without loading special options such as collection, environment etc. This
     * function does not access the network or the file-system.
     *
     * @param {Array} procArgv - An array of strings, each corresponding to a command line argument.
     * @param {String} programName - The program name displayed at the start of every newman run.
     * @param {Function} callback - The callback function whose invocation marks the end of the raw options parsing.
     * @returns {*}
     */
    rawOptions = function (procArgv, programName, callback) {
        var legacyMode = (procArgv.length && _.startsWith(procArgv[0], '-') &&
                !_.includes(['--help', '-h'], procArgv[0])),
            reporterArgs,
            rawArgs,
            result,
            NO_COMMAND_SPECIFIED;
        commands();
        rawArgs = separateReporterArgs(procArgv);

        try {
            result = program.parse(process.argv);
            // Check the program.args obj
            NO_COMMAND_SPECIFIED = program.args.length === 0;
            // Handle it however you like
            if (NO_COMMAND_SPECIFIED) {
            // e.g. display usage
                program.help();
            }
        }
        catch (e) {
            program.outputHelp(callback);
        }

        // if (result.help) {
        //     program.outputHelp(callback);
        // }
        // // Version command
        // if (result.version) {
        //     return callback(null, { command: 'version' });
        // }

        // if (legacyMode && !result.silent) {
        //     // @todo: add a link to the migration guide just before releasing V3
        //     // eslint-disable-next-line max-len
        //     console.warn(`${colors.yellow('newman:')} the v2.x CLI options are deprecated. You should use newman run <path> [options] instead.`);
        //     console.warn('        refer https://github.com/postmanlabs/newman/blob/develop/MIGRATION.md for details.');
        // }

        // Convert all arguments to CamelCase
        // result = _.transform(result, function (accumulator, value, key) {
        //     accumulator[_.camelCase(key)] = value;
        // }, {});
        console.log("Reporters : ", result.reporters);
        // Handle the reporter Names
        _.isString(result.reporters) && (result.reporters = result.reporters.split(','));
        
        // Populate the reporter args as well.
        reporterArgs = reporter(rawArgs.reporter, result.reporters);
        result.reporterOptions = reporterArgs.generic;
        result.reporter = _.transform(_.omit(reporterArgs, 'generic'), function (acc, value, key) {
            acc[key] = _.assignIn(value, reporterArgs.generic);
        }, {});

        !legacyMode && (result = {
            [result.command]: _.omit(result, 'command'),
            command: result.command
        });

        // Map the older options to the new sub-command based format.
        legacyMode && (result = (function (legacy) {
            var run = {},
                reporter = {},
                reporters = ['cli']; // CLI is always available in the legacy mode.

            // basic options: collection, environment, folder, data, and globals
            run.collection = legacy.collection || legacy.url;
            run.environment = legacy.environment || legacy.environmentUrl;
            run.folder = legacy.folder;
            run.iterationData = legacy.data;
            run.globals = legacy.global;

            // request options: delays, timeouts, redirect handling behaviour
            run.delayRequest = legacy.delay;
            run.timeoutRequest = legacy.requestTimeout;
            run.ignoreRedirects = legacy.avoidRedirects;

            // security options
            run.insecure = legacy.insecure;
            run.tls = legacy.tls;

            // export options
            run.exportEnvironment = legacy.exportEnvironment;
            run.exportGlobals = legacy.exportGlobals;

            // reporter options
            run.reporterHtmlExport = legacy.html;
            run.reporterJunitExport = legacy.testReportFile;
            run.reporterJsonExport = legacy.outputFile;
            run.reporterCliNoSummary = legacy.noSummary;

            // response and output options
            run.noColor = legacy.noColor || legacy.whiteScreen;
            run.iterationCount = legacy.number;
            run.disableUnicode = legacy.noTestSymbols;
            run.encoding = legacy.encoding;

            // error / exit handling
            run.bail = legacy.stopOnError;
            run.suppressExitCode = legacy.exitCode;

            // Handle reporter options.
            legacy.outputFile && _.set(reporter, 'json.output', legacy.outputFile) && reporters.push('json');
            legacy.outputFileVerbose && _.set(reporter, 'verbose.output', legacy.outputFileVerbose) &&
            reporters.push('verbose');
            legacy.testReportFile && _.set(reporter, 'junit.output', legacy.testReportFile) && reporters.push('junit');
            legacy.html && _.set(reporter, 'html.output', legacy.html) && reporters.push('html');

            run.reporter = reporter;
            run.reporters = reporters;

            return {
                run: run,
                command: 'run'
            };
        }(result)));
        return callback(null, result);
    };

/**
 * Loads resources from the network, and then calls the callback.
 *
 * @param {Array} procArgv - The array of tokenised CLI argument strings.
 * @param {String} programName - The displayed program name during runs.
 * @param {Function} callback - The callback function whose invocation marks the end of the CLI parsing routine.
 * @returns {*}
 */
module.exports = function (procArgv, programName, callback) {
    async.waterfall([
        function (cb) {
            rawOptions(procArgv, programName, cb);
        },
        function (options, cb) {
            // Handle logging configurations here
            cb(null, options);
        }
    ], callback);
};

module.exports.rawOptions = rawOptions;
