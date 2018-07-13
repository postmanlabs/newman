#!/usr/bin/env node
require('../lib/node-version-check'); // @note that this should not respect CLI --silent

var _ = require('lodash'),
    program = require('commander'),
    version = require('../package.json').version,
    newman = require('../'),
    colors = require('colors'),

    /**
     * A CLI parser helper to process stringified numbers into integers, perform safety checks, and return the result.
     *
     * @param {String} arg - The stringified number argument pulled from the CLI arguments list.
     * @returns {Number} - The supplied argument, casted to an integer.
     */
    Integer = function (arg) {
        var num = Number(arg);
        if (!_.isSafeInteger(num) || num <= 0) {
            throw new Error('The value must be a positive integer.');
        }

        return num.valueOf();
    },

    /**
     * Separates reporter specific arguments from the rest.
     *
     * @param {Array} allArgs - An array of strings, each coresponding to a CLI argument.
     * @returns {Object} - An object with reporter and regular argument key-values.
     */
    separateReporterArgs = function (allArgs) {
        var reporterArgs = [],
            args = [],
            arg,
            index,
            i;

        // Separate the reporter arguments from the rest
        for (i = 0; i < allArgs.length; i++) {
            arg = allArgs[i];

            if (!_.startsWith(arg, '--reporter-')) {
                args.push(arg);
                continue;
            }

            index = arg.indexOf('=');

            if (index !== -1) {
                // Split the attribute if its like key=value
                reporterArgs.push(arg.slice(0, index), arg.slice(index + 1));
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
     *  used for collecting global key=value variables supplied through command line
     *
     * --global-var "foo=bar" --global-var "alpha=beta"
     *
     * @param {String} val - The argument provided to `--global-var`.
     * @param {Array} memo - The array that is populated by key value pairs.
     * @returns {Array} - [{key, value}] - The object representation of the current CLI variable.
    */
    collect = function (val, memo) {
        var arg,
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
    arrayCollect = function (list) {
        return _.split(list, ',');
    },

    /**
     *  used for resetting the program instance for consecutive runs.
    */
    resetProgram = function () {
        for (var prop in program) {
            if (_.has(program, prop)) {
                if (program[prop] instanceof Array) {
                    program[prop] = [];
                }
                else if (program[prop] instanceof Object) {
                    program[prop] = {};
                }
                else {
                    delete program[prop];
                }
            }
        }
        program
            .version(version)
            .name('newman');
    },

    /**
     * Creates a parser capable of handling legacy options.
     *
     * @param  {Object} rawArgs - The rawArgs supplied to rawOptions, to be passed to program.parse()
     *
     *  Adds legacy options to the common commander program instance.
     * @private
     */
    legacy = function (rawArgs) {
        resetProgram();
        program
            .usage('[options] <collection>')
            .option('-c, --collection <path>', 'DEPRECATED: Specify a Postman collection as a JSON file')
            .option('-u, --url <path>', 'DEPRECATED: Specify a Postman collection as a URL')
            .option('-e, --environment <path>', 'DEPRECATED: Specify a Postman environment as a JSON file')
            .option('--environment-url <path>', 'DEPRECATED: Specify a Postman environment as a URL')
            .option('-g, --global <path>', 'DEPRECATED: Specify Postman Globals as a JSON file')
            .option('-n, --number <n>', 'DEPRECATED: Define the number of iterations to run', Integer)
            .option('-f, --folder <path>',
                'DEPRECATED: Run a single folder from a collection. To be used with -c or -u')
            .option('-r, --requestTimeout <n>', 'DEPRECATED: Specify a request timeout (in ms) for requests', Integer)
            .option('-y, --delay [n]',
                'DEPRECATED: Specify the extent of delay between requests (milliseconds)', Integer, 0)
            .option('-R, --avoidRedirects', 'DEPRECATED: Prevents Newman from automatically following redirects')
            .option('-k, --insecure', 'DEPRECATED: Disable strict ssl', false)
            .option('-d, --data <path>', 'DEPRECATED: Specify a data file to use for iterations (either json or csv)')
            .option('-E, --exportEnvironment <path>',
                'DEPRECATED: Exports the environment to a file after completing the run')
            .option('-G, --exportGlobals <path>', 'DEPRECATED: Specify an output file to dump Globals before exiting')
            .option('-H, --html <path>', 'DEPRECATED: Export a HTML report to a specified file')
            .option('-j, --no-summary', 'DEPRECATED: Prohibits any output from being logged', false)
            .option('-C, --noColor', 'DEPRECATED: Disables coloured output', false)
            .option('-S, --noTestSymbols',
                'DISCONTINUED: Disables tick and cross symbols for the output, reverting to PASS|FAIL instead', false)
            .option('-l, --tls', 'DISCONTINUED: Specifies whether to use TLS v1 or not', false)
            .option('-N, --encoding <choice>', 'DEPRECATED: Specifies and encoding for the response',
                /^(ascii|utf8|utf16le|ucs2|base64|binary|hex)$/i, false)
            .option('-o, --outputFile <path>', 'DEPRECATED: Path to file for writing output to')
            .option('-O, --outputFileVerbose <path>',
                'DISCONTINUED: Path to file for writing the full collection run details to')
            .option('-t, --testReportFile <path>', 'DEPRECATED: Path to file for writing JUnit XML results to')
            .option('-i, --import <path>',
                'DEPRECATED: Import a Postman backup file, and save collections, environments, globals, and data')
            .option('-p, --pretty', 'DEPRECATED: Enabled pretty print while displaying collection run information')
            .option('-W, --whiteScreen', 'DISCONTINUED: Inverts the color scheme for collection run output', false)
            .option('-L, --recurseLimit <n>',
                'DEPRECATED: Limits recursive variable resolution for collection runs', Integer, 20)
            .option('-s, --stopOnError',
                'DEPRECATED: Stops the runner with a non-zero exit code when any test assertion fails', false)
            .option('-x, --exitCode',
                'DEPRECATED: Continues running tests despite test failures, but exit with code 1', false)
            .option('--silent', 'Prevents newman from showing output to CLI', false)
            .option('--color', 'Force colored output (for use in CI environments)')
            .option('collection <path>', 'URL or path to a Postman Collection')
            .parse(rawArgs);
    },

    /**
     * Creates a parser capable of handling options typically given to "newman run" command.
     *
     * @param  {Object} rawArgs - The rawArgs supplied to rawOptions, to be passed to program.parse()
     *
     *  Adds run command options to the common commander program instance.
     * @private
     */
    run = function (rawArgs) {
        resetProgram();
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
            // commander had some issue with flags starting with --no, thus camelCased
            // resolved https://github.com/tj/commander.js/pull/709
            .option('--color', 'Force colored output (for use in CI environments).')
            .option('--no-color', 'Disable colored output.')
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
            .parse(rawArgs);
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
     * Traverses the options object to populate a name array.
     *
     * @param {Object} options - The options populated through CLI.
     * @returns {Array} - An array of option names in camelCase format.
     */
    getOptionNames = function (options) {
        var optionName,
            optionNames = [];
        options.options.forEach(function (option) {
            optionName = option.long;
            optionName = optionName.replace('--', '');
            optionName = optionName.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
            optionNames.push(optionName);
        });
        return optionNames;
    },

    /**
     * Formats the legacy options to the required format for the dispatch function.
     *
     * @param {Object} options - The options populated through CLI.
     * @returns {Object} - An object of formatted legacy options.
     */
    formatLegacyOptions = function (options) {
        var optionsObj = {},
            prop,
            run = {},
            reporter = {},
            reporters = ['cli'],
            optionNames = [],
            args;

        optionNames = getOptionNames(options);

        for (prop in options) {
            if (_.includes(optionNames, String(prop))) {
                run[prop] = options[prop];
            }
        }

        if (!run.collection && (options.rawArgs || options.args)) {
            run.collection = options.rawArgs[1] || options.args[0];
        }
        args = [
            { alt: 'url', target: 'collection' },
            { alt: 'environmentUrl', target: 'environment' },
            { alt: 'data', target: 'iterationData' },
            { alt: 'global', target: 'globals' },
            { alt: 'delay', target: 'delayRequest' },
            { alt: 'requestTimeout', target: 'timeoutRequest' },
            { alt: 'avoidRedirects', target: 'ignoreRedirects' },
            { alt: 'html', target: 'reporterHtmlExport' },
            { alt: 'testReportFile', target: 'reporterJunitExport' },
            { alt: 'whiteScreen', target: 'noColor' },
            { alt: 'number', target: 'iterationCount' },
            { alt: 'noTestSymbols', target: 'disableUnicode' },
            { alt: 'stopOnError', target: 'bail' },
            { alt: 'exitCode', target: 'suppressExitCode' }
        ];

        args.forEach(function (arg) {
            run[arg.alt] && _.isEmpty(run[arg.target]) && (run[arg.target] = run[arg.alt]);
        });

        if (options.summary === false && !run.reporterCliNoSummary) {
            run.reporterCliNoSummary = true;
        }
        if (!options.color || run.noColor) {
            run.color = false;
        }
        if (run.outputFile && _.set(reporter, 'json.output', run.outputFile)) {
            reporters.push('json');
        }
        if (run.outputFileVerbose && _.set(reporter, 'verbose.output', run.outputFileVerbose)) {
            reporters.push('verbose');
        }
        if (run.testReportFile && _.set(reporter, 'junit.output', run.testReportFile)) {
            reporters.push('junit');
        }
        if (run.html && _.set(reporter, 'html.output', run.html)) {
            reporters.push('html');
        }

        run.reporter = reporter;
        run.reporters = reporters;

        optionsObj.command = 'run';
        optionsObj.run = run;
        return optionsObj;
    },

    /**
     * Formats the options to the required format for the dispatch function.
     *
     * @param {Object} options - The options populated through CLI.
     * @returns {Object} - An object of formatted options.
     */
    formatOptions = function (options) {
        var command = (_.includes(options.rawArgs[0], 'version') ||
        _.includes(options.rawArgs[0], '-v') || _.includes(options.rawArgs[0], '-V')) ?
                'version' : options._name,
            optionsObj, prop,
            optionNames = [];

        optionNames = getOptionNames(options);

        optionsObj = { [command]: {} };
        optionsObj.command = command;
        optionsObj.version = options.parent._version || false;
        optionsObj[command].collection = options.args || options.rawArgs ? options.args[1] || options.rawArgs[1] : null;
        optionsObj[command].reporter = options.reporter || {};
        optionsObj[command].reporterOptions = options.reporterOptions || {};

        for (prop in options) {
            if (_.includes(optionNames, String(prop))) {
                optionsObj[command][prop] = options[prop];
            }
        }

        return optionsObj;
    },

    /**
     * Logs the message passed as a warning and then exits.
     *
     * @param {String} msg - The message to be logged.
     *
     */
    customError = function (msg) {
        console.warn(msg);
        process.exit(0);
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
        var slicedArgs = procArgv.slice(2),
            legacyMode = !_.includes(procArgv, 'run') &&
        !_.includes(['--help', '-h', '--version', '-v', '-V'], procArgv[2]) &&
        !_.isEmpty(slicedArgs),
            reporterArgs,
            rawArgs,
            result,
            checkForColor,
            checkForVersion,
            checkForCommand,
            vPos,
            validCommands = [];

        !legacyMode && !module.parent && (procArgv = slicedArgs);
        rawArgs = separateReporterArgs(procArgv);
        try {
            if (!legacyMode) {
                run(rawArgs.argv);
                program.commands.forEach(function (command) {
                    validCommands.push(command._name);
                    if (command._name === 'run') {
                        result = command;
                    }
                });
            }
            else {
                legacy(rawArgs.argv);
                result = program;
            }

            if (_.isEmpty(procArgv) || _.includes(procArgv, '-h') || _.includes(procArgv, '--help')) {
                return result.outputHelp();
            }
            checkForVersion = _.includes(rawArgs.argv, '--version') ||
                _.includes(rawArgs.argv, '-v') ||
                _.includes(rawArgs.argv, '-V');
            checkForCommand = _.includes(validCommands, rawArgs.argv[0]);

            !checkForVersion && !legacyMode && !checkForCommand &&
            customError('\nNewman: Invalid command or parameter.\n\n' +
            'Example:\nnewman run my-api.json -e variables.json\n\n' +
            'For more information, run:\nnewman --help\n');
        }
        catch (error) {
            return callback(_.set(error, 'help', program.outputHelp()));
        }

        if (legacyMode && !result.silent) {
            // @todo: add a link to the migration guide just before releasing V3
            // eslint-disable-next-line max-len
            console.warn(`${colors.yellow('newman:')} the v2.x CLI options are deprecated. You should use newman run <path> [options] instead.`);
            console.warn('        refer https://github.com/postmanlabs/newman/blob/develop/MIGRATION.md for details.');
        }

        // Handle the reporter Names
        _.isString(result.reporters) && (result.reporters = result.reporters.split(','));

        // Populate the reporter args as well.
        reporterArgs = reporter(rawArgs.reporter, result.reporters);
        result.reporterOptions = reporterArgs.generic;
        result.reporter = _.transform(_.omit(reporterArgs, 'generic'), function (acc, value, key) {
            acc[key] = _.assignIn(value, reporterArgs.generic);
        }, {});
        // eslint-disable-next-line max-len
        // This hack has been added from //https://github.com/mochajs/mocha/blob/961c5392480a6e9ca730e43a4e86fde0d4420fc9/bin/_mocha#L20//2-L211
        // @todo remove when https://github.com/tj/commander.js/issues/691 is fixed.
        checkForColor = _.includes(rawArgs.argv, '--no-color') || _.includes(rawArgs.argv, '--noColor');
        if ((vPos = rawArgs.argv.indexOf('-v')) > -1) {
            rawArgs[vPos] = '-V';
        }
        if (checkForColor) {
            result.color = false;
            result.noColor = true;
        }
        else {
            result.color = true;
            result.noColor = false;
        }
        if (!legacyMode) {
            result = formatOptions(result);
        }
        else {
            result = formatLegacyOptions(result);
        }
        return callback(null, result);
    },

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

module.exports = rawOptions;

/**
* Loads resources from the network, and then calls the callback.
*
* @param {Array} procArgv - The array of tokenised CLI argument strings.
* @param {String} programName - The displayed program name during runs.
* @param {Function} callback - The callback function whose invocation marks the end of the CLI parsing routine.
* @returns {*}
*/
// ensure we run this script exports if this is a direct stdin
// exported rawOptions above for cases when required as a module for eg tests.
!module.parent && module.exports(process.argv, 'newman', function (err, args) {
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
