require('colors');

var _ = require('lodash'),
    argparse = require('argparse'),
    async = require('async'),
    version = require('../../package.json').version,

    NEWMAN_ASCII = [
        '',
        '      ,-————,',
        '     / _____ \\',
        '    ( | >   | )',
        '     \\   —   /',
        '      `—————‘'
    ],

    /**
     * Separates reporter specific arguments from the rest.
     *
     * @todo Figure out a better way! (Or submit a PR to argparse).
     * @param allArgs
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
    Integer = (arg) => {
        var num = Number(arg);

        if (!_.isSafeInteger(num) || num < 1) {
            throw new Error('The value of iteration count must be an integer greater than zero');
        }

        return num.valueOf();
    },

    /**
     * Creates a parser for the older CLI arguments. (Without sub-commands).
     *
     * @param program
     * @returns {*}
     */
    execute = (program) => {
        var parser = new argparse.ArgumentParser({
                description: 'The command line collection runner for Postman',
                debug: true, // Prevents argparse from exiting, and allows us to handle any errors.
                prog: program
            }),
            collectionGroup = parser.addMutuallyExclusiveGroup({ required: true }),
            environmentGroup = parser.addMutuallyExclusiveGroup();

        collectionGroup.addArgument(['-c', '--collection'], {
            help: 'DEPRECATED: Specify a Postman collection as a JSON file'
        });

        collectionGroup.addArgument(['-u', '--url'], {
            help: 'DEPRECATED: Specify a Postman collection as a URL'
        });

        environmentGroup.addArgument(['-e', '--environment'], {
            help: 'DEPRECATED: Specify a Postman environment as a JSON file'
        });

        environmentGroup.addArgument(['--environment-url'], {
            help: 'DEPRECATED: Specify a Postman environment as a URL'
        });

        parser.addArgument(['-g', '--global'], {
            help: 'DEPRECATED: Specify Postman Globals as a JSON file'
        });

        parser.addArgument(['-n', '--number'], {
            help: 'DEPRECATED: Define the number of iterations to run',
            type: Integer,
            defaultValue: 1
        });

        parser.addArgument(['-f', '--folder'], {
            help: 'DEPRECATED: Run a single folder from a collection. To be used with -c or -u'
        });

        parser.addArgument(['-r', '--requestTimeout'], {
            help: 'DEPRECATED: Specify a request timeout (in ms) for requests',
            type: Integer
        });

        parser.addArgument(['-y', '--delay'], {
            help: 'DEPRECATED: Specify the extent of delay between requests (milliseconds)',
            type: Integer,
            defaultValue: 0
        });

        parser.addArgument(['-R', '--avoidRedirects'], {
            help: 'DEPRECATED: Prevents Newman from automatically following redirects',
            action: 'storeTrue'
        });

        parser.addArgument(['-k', '--insecure'], {
            help: 'DEPRECATED: Disable strict ssl',
            action: 'storeTrue',
            defaultValue: false
        });

        parser.addArgument(['-d', '--data'], {
            help: 'DEPRECATED: Specify a data file to use for iterations (either json or csv)'
        });

        parser.addArgument(['-E', '--exportEnvironment'], {
            help: 'DEPRECATED: Exports the environment to a file after completing the run'
        });

        parser.addArgument(['-G', '--exportGlobals'], {
            help: 'DEPRECATED: Specify an output file to dump Globals before exiting'
        });

        parser.addArgument(['-H', '--html'], {
            help: 'DEPRECATED: Export a HTML report to a specified file'
        });

        parser.addArgument(['-j', '--no-summary'], {
            help: 'DEPRECATED: Prohibits any output from being logged',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        parser.addArgument(['-C', '--noColor'], {
            help: 'DEPRECATED: Disables coloured output',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        parser.addArgument(['-S', '--noTestSymbols'], {
            help: 'DISCONTINUED: Disables tick and cross symbols for the output, reverting to PASS|FAIL instead',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        parser.addArgument(['-l', '--tls'], {
            help: 'DISCONTINUED: Specifies whether to use TLS v1 or not',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        parser.addArgument(['-N', '--encoding'], {
            help: 'DEPRECATED: Specifies and encoding for the response',
            defaultValue: false,
            choices: ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex']
        });

        parser.addArgument(['-o', '--outputFile'], {
            help: 'DEPRECATED: Path to file for writing output to'
        });

        parser.addArgument(['-O', '--outputFileVerbose'], {
            help: 'DISCONTINUED: Path to file for writing the full collection run details to'
        });

        parser.addArgument(['-t', '--testReportFile'], {
            help: 'DEPRECATED: Path to file for writing JUnit XML results to'
        });

        parser.addArgument(['-i', '--import'], {
            help: 'DEPRECATED: Import a Postman backup file, and save collections, environments, globals, and data'
        });

        parser.addArgument(['-p', '--pretty'], {
            help: 'DEPRECATED: Enabled pretty print while displaying collection run information'
        });

        parser.addArgument(['-W', '--whiteScreen'], {
            help: 'DISCONTINUED: Inverts the color scheme for collection run output',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        parser.addArgument(['-L', '--recurseLimit'], {
            help: 'DEPRECATED: Limits recursive variable resolution for collection runs',
            type: Integer,
            defaultValue: 20
        });

        parser.addArgument(['-s', '--stopOnError'], {
            help: 'DEPRECATED: Stops the runner with a non-zero exit code when any test assertion fails',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        parser.addArgument(['-x', '--exitCode'], {
            help: 'DEPRECATED: Continues running tests despite test failures, but exit with code 1',
            type: Boolean,
            defaultValue: false,
            action: 'storeTrue'
        });

        return parser;
    },

    /**
     * Creates a parser for the command line options which are common across multiple commands.
     *
     * @returns {*}
     * @private
     */
    _common = () => {
        var commonParser = new argparse.ArgumentParser({
            debug: true,
            addHelp: false
        });

        commonParser.addArgument(['-v', '--version'], {
            help: 'Display the newman version'
        });

        commonParser.addArgument(['--no-color'], {
            help: 'Disable colored output',
            action: 'storeTrue'
        });

        return commonParser;
    },

    /**
     * Creates a parser that can be used to parse out HTTP specific request options.
     *
     * @returns {*}
     * @private
     */
    _request = () => {
        var requestOptionsParser = new argparse.ArgumentParser({
            debug: true,
            addHelp: false
        });

        requestOptionsParser.addArgument(['--timeout-request'], {
            help: 'Specify a timeout for requests (in milliseconds)',
            type: Integer
        });

        requestOptionsParser.addArgument(['--ignore-redirects'], {
            help: 'If present, Newman will not follow HTTP Redirects',
            action: 'storeTrue'
        });

        requestOptionsParser.addArgument(['-k', '--insecure'], {
            help: 'Disables SSL validations.',
            action: 'storeTrue'
        });

        return requestOptionsParser;
    },


    /**
     * Creates a parser capable of handling options typically given to "newman run" command.
     *
     * @returns {*}
     */
    _run = () => {
        var runParser = new argparse.ArgumentParser({
            debug: true,
            addHelp: false
        });

        runParser.addArgument('collection', {
            help: 'URL or path to a Postman Collection'
        });

        runParser.addArgument(['-e', '--environment'], {
            help: 'Specify a URL or Path to a Postman Environment'
        });

        runParser.addArgument(['-g', '--globals'], {
            help: 'Specify a URL or Path to a file containing Postman Globals'
        });

        runParser.addArgument(['--folder'], {
            help: 'Run a single folder from a collection'
        });

        runParser.addArgument(['--reporters'], {
            help: 'Specify the reporters to use for this run',
            defaultValue: 'cli'
        });

        runParser.addArgument(['-n', '--iteration-count'], {
            help: 'Define the number of iterations to run.',
            type: Integer,
            defaultValue: 1
        });

        runParser.addArgument(['-d', '--iteration-data'], {
            help: 'Specify a data file to use for iterations (either json or csv)'
        });

        runParser.addArgument(['--export-environment'], {
            help: 'Exports the environment to a file after completing the run'
        });

        runParser.addArgument(['--export-globals'], {
            help: 'Specify an output file to dump Globals before exiting'
        });

        runParser.addArgument(['--export-collection'], {
            help: 'Specify an output file to save the executed collection'
        });

        runParser.addArgument(['--delay-request'], {
            help: 'Specify the extent of delay between requests (milliseconds)',
            type: Integer,
            defaultValue: 0
        });

        runParser.addArgument(['--stop-on-error'], {
            help: 'Specify whether or not to stop a collection run on encountering the first error',
            type: Boolean,
            action: 'storeTrue',
            defaultValue: false
        });

        runParser.addArgument(['-x', '--suppress-exit-code'], {
            help: 'Specify whether or not to override the default exit code for the current run',
            type: Boolean,
            action: 'storeTrue',
            defaultValue: false
        });

        return runParser;
    },

    /**
     * Parses the variadic arguments for reporters.
     *
     * @param {Array} args
     * @param {Array} reporters
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
        _.each(reporters, (reporter) => { parsed[reporter] = {}; });

        for (i = 0; i < args.length; i++) {
            // Remove trailing whitespace
            arg = _.trim(args[i]);

            // Remove "--reporter-"
            arg = arg.replace('--reporter-', '');

            name = _.split(arg, '-', 1)[0];  // Reporter Name.

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
     * Loads the raw options for Newman, without loading special options such as collection, environment etc.
     * This function does not access the network or the file-system.
     *
     * @param procArgv
     * @param program
     * @param callback
     * @returns {*}
     */
    rawOptions = function (procArgv, program, callback) {
        if (procArgv.indexOf('-v') > -1 || procArgv.indexOf('--version') > -1) {
            console.log(version);

            return callback(null, version);
        }

        var legacyMode = (procArgv.length && _.startsWith(procArgv[0], '-') &&
                !_.includes(['--help', '-h'], procArgv[0])),
            parser = !legacyMode ? new argparse.ArgumentParser({
                description: NEWMAN_ASCII.join('\n') + '\n\n' +
                    'The command line Collection runner for Postman.\n\n' +
                    'More information: https://github.com/postmanlabs/newman', // @todo: perhaps add page on the website
                debug: true, // Prevents argparse from exiting, and allows us to handle any errors.
                prog: program,
                // Ensure that the formatting of the description is retained.
                formatterClass: argparse.RawTextHelpFormatter
            }) : execute(program),

            reporterArgs,
            rawArgs,
            result;

        if (legacyMode) {
            // @todo: add a link to the migration guide just before releasing V3
            console.warn('Newman is running in V2 compatibility mode'.yellow.bold);
        }

        !legacyMode && parser.addSubparsers({
            title: 'Available Commands: (Use -h with each to see the supported arguments)',
            // description: '',
            dest: 'command'
        }).addParser('run', {
            debug: true,
            description: 'The "run" command can be used to run Postman Collections',
            parents: [_common(), _request(), _run()]
        });

        // Separate the reporter
        rawArgs = separateReporterArgs(procArgv);

        try {
            result = parser.parseArgs(rawArgs.argv);
        }
        catch (e) {
            e.help = parser.formatHelp();
            return callback(e);
        }

        // Convert all arguments to CamelCase
        result = _.transform(result, function (accumulator, value, key) {
            accumulator[_.camelCase(key)] = value;
        }, {});

        // Handle the reporter Names
        _.isString(result.reporters) && (result.reporters = result.reporters.split(','));

        // Populate the reporter args as well.
        reporterArgs = reporter(rawArgs.reporter, result.reporters);
        result.reporterOptions = reporterArgs.generic;
        result.reporter = _.transform(_.omit(reporterArgs, 'generic'), function (acc, value, key) {
            acc[key] = _.extend(value, reporterArgs.generic);
        }, {});

        !legacyMode && (result = {
            [result.command]: _.omit(result, 'command'),
            command: result.command
        });

        // Map the older options to the new sub-command based format.
        legacyMode && (result = (function (legacy) {
            var run = {},
                reporter = {},
                reporters = ['cli'];  // CLI is always available in the legacy mode.

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
            run.stopOnError = legacy.stopOnError;
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
 * @param procArgv
 * @param program
 * @param callback
 */
module.exports = function (procArgv, program, callback) {
    async.waterfall([
        function (cb) {
            rawOptions(procArgv, program, cb);
        },
        function (options, cb) {
            // Handle logging configurations
            // here
            cb(null, options);
        }
    ], callback);
};

module.exports.rawOptions = rawOptions;
