var _ = require('lodash'),
    argparse = require('argparse'),
    fs = require('fs'),
    async = require('async'),
    parseJson = require('parse-json'),
    request = require('request'),

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

    /**
     * Loads JSON data from the given location.
     *
     * @param {string} location - Can be an HTTP URL or a local file path.
     * @param {object=} options
     * @param {object} options.apikey - Postman's cloud API Key (if the resource is being loaded from Postman Cloud)
     * @param callback
     * @returns {Promise}
     */
    fetch = function (location, options, callback) {
        !callback && _.isFunction(options) && (callback = options, options = {});
        return (/^https?:\/\/.*/).test(location) ?
            // Load from URL
            request.get({ url: location, json: true }, (err, response, body) => {
                if (err) {
                    return callback(err);
                }

                try {
                    _.isString(body) && (body = parseJson(body));
                }
                catch (e) {
                    return callback(new Error('Given URL did not provide a valid JSON response: ', location));
                }

                return callback(null, body);
            }) :
            fs.readFile(location, function (err, value) {
                if (err) {
                    return callback(err);
                }

                try {
                    value = parseJson(value.toString());
                }
                catch (e) {
                    callback(new Error('Given file does not contain valid JSON data: ', location));
                }

                return callback(null, value);
            });
    },

    /**
     * Creates a parser for the older CLI arguments. (Without subcommands).
     *
     * @param program
     * @returns {*}
     */
    execute = (program) => {
        var parser = new argparse.ArgumentParser({
                description: 'The command line collection runner for Postman.',
                debug: true, // Prevents argparse from exiting, and allows us to handle any errors.
                prog: program
            }),
            collectionGroup = parser.addMutuallyExclusiveGroup({ required: true }),
            environmentGroup = parser.addMutuallyExclusiveGroup(),
            exitMethodGroup = parser.addMutuallyExclusiveGroup();

        collectionGroup.addArgument(['-c', '--collection'], {
            help: 'Specify a Postman collection as a JSON file'
        });

        collectionGroup.addArgument(['-u', '--url'], {
            help: 'Specify a Postman collection as a URL'
        });

        parser.addArgument(['-f', '--folder'], {
            help: 'Run a single folder from a collection. To be used with -c or -u'
        });

        environmentGroup.addArgument(['-e', '--environment'], {
            help: 'Specify a Postman environment as a JSON file'
        });

        environmentGroup.addArgument(['--environment-url'], {
            help: 'Specify a Postman environment as a URL'
        });

        parser.addArgument(['-E', '--exportEnvironment'], {
            help: 'Exports the environment to a file after completing the run'
        });

        parser.addArgument(['-d', '--data'], {
            help: 'Specify a data file to use for iterations (either json or csv)'
        });

        parser.addArgument(['-g', '--global'], {
            help: 'Specify Postman Globals as a JSON file'
        });

        parser.addArgument(['-G', '--exportGlobals'], {
            help: 'Specify an output file to dump Globals before exiting'
        });

        parser.addArgument(['-y', '--delay'], {
            help: 'Specify a delay (in ms) between requests',
            type: Number
        });

        parser.addArgument(['-r', '--requestTimeout'], {
            help: 'Specify a request timeout (in ms) for requests',
            type: Number
        });

        parser.addArgument(['-R', '--avoidRedirects'], {
            help: 'Prevents Newman from automatically following redirects',
            action: 'storeTrue'
        });

        parser.addArgument(['-j', '--noSummary'], {
            help: 'Doesn\'t show the summary for each iteration',
            action: 'storeTrue'
        });

        parser.addArgument(['-n', '--number'], {
            help: 'Define the number of iterations to run',
            type: Number
        });

        parser.addArgument(['-C', '--noColor'], {
            help: 'Disable colored output',
            action: 'storeTrue'
        });

        parser.addArgument(['-S', '--noTestSymbols'], {
            help: 'Disable symbols in test output and use PASS|FAIL instead',
            action: 'storeTrue'
        });

        parser.addArgument(['-k', '--insecure'], {
            help: 'Disable strict ssl',
            action: 'storeTrue',
            defaultValue: false
        });

        parser.addArgument(['-l', '--tls'], {
            help: 'Use TLSv1',
            action: 'storeTrue',
            defaultValue: false
        });

        parser.addArgument(['-N', '--encoding'], {
            help: 'Specify an encoding for the response.',
            choices: ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex']
        });

        parser.addArgument(['-o', '--outputFile'], {
            help: 'Path to file where output should be written.'
        });

        parser.addArgument(['-O', '--outputFileVerbose'], {
            help: 'Path to file where full request and responses should be logged.'
        });

        parser.addArgument(['-t', '--testReportFile'], {
            help: 'Path to file where results should be written as JUnit XML.'
        });

        // todo: implement support for this.
        parser.addArgument(['-i', '--import'], {
            help: 'Import a Postman backup file, and save collections, environments, and globals.'
        });
        parser.addArgument(['-p', '--pretty'], {
            help: 'Enable pretty-print while saving imported collections, environments, and globals.'
        });

        parser.addArgument(['-H', '--html'], {
            help: 'Export a HTML report to a specified file.'
        });

        parser.addArgument(['-W', '--whiteScreen'], {
            help: 'Black text for white screen',
            action: 'storeTrue',
            defaultValue: false
        });

        parser.addArgument(['-L', '--recurseLimit'], {
            help: 'Do not run recursive resolution more than [limit] times. Default = 10. Using 0 will prevent any variable resolution.',
            type: Number
        });

        exitMethodGroup.addArgument(['-s', '--stopOnError'], {
            help: 'Stops the runner with non-zero exit code when a test case fails',
            action: 'storeTrue',
            defaultValue: true
        });

        exitMethodGroup.addArgument(['-x', '--exitCode'], {
            help: 'Continue running tests even after a failure, but exit with code=1.',
            action: 'storeTrue',
            defaultValue: false
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

        commonParser.addArgument(['--no-color'], {
            help: 'Disable colored output.',
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

        return requestOptionsParser;
    },


    /**
     * Creates a parser capable of handling options typically given to "newman run" command.
     *
     * @param {String} program - CLI Program name
     * @param {Array=} parents - Any parent parsers can be specified here.
     * @returns {*}
     */
    _run = () => {
        var runParser = new argparse.ArgumentParser({
            debug: true,
            addHelp: false
        });

        runParser.addArgument('collection', {
            help: 'URL or path to a Postman Collection.'
        });

        runParser.addArgument(['-e', '--environment'], {
            help: 'Specify a URL or Path to a Postman Environment.'
        });

        runParser.addArgument(['-g', '--globals'], {
            help: 'Specify a URL or Path to a file containing Postman Globals.'
        });

        runParser.addArgument(['-n', '--iteration-count'], {
            help: 'Define the number of iterations to run.',
            type: Number,
            defaultValue: 1
        });

        runParser.addArgument(['--reporters'], {
            help: 'Specify the reporters to use for this run.',
            defaultValue: 'cli'
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
        var legacyMode = (procArgv.length && _.startsWith(procArgv[0], '-') && !_.includes(['--help', '-h'], procArgv[0])),
            parser = !legacyMode ? new argparse.ArgumentParser({
                description: NEWMAN_ASCII.join('\n') + '\n\n' +
                    'The command line Collection runner for Postman.\n\n' +
                    'More information: https://github.com/postmanlabs/newman', // todo: perhaps add a page on the website
                debug: true, // Prevents argparse from exiting, and allows us to handle any errors.
                prog: program,
                // Ensure that the formatting of the description is retained.
                formatterClass: argparse.RawTextHelpFormatter
            }) : execute(program),

            reporterArgs,
            rawArgs,
            result;

        !legacyMode && parser.addSubparsers({
            title: 'Available Commands: (Use -h with each to see the supported arguments.)',
            // description: '',
            dest: 'command'
        }).addParser('run', {
            debug: true,
            description: 'The "run" command can be used to run Postman Collections.',
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

        // Map the older options to the new subcommand based format.
        legacyMode && (result = (function (legacy) {
            var run = {},
                reporter = {},
                reporters = ['cli'];  // CLI is always available in the legacy mode.

            run.collection = legacy.collection || legacy.url;
            run.environment = legacy.environment || legacy.environmentUrl;
            run.folder = legacy.folder;
            run.exportEnvironment = legacy.exportEnvironment;
            run.data = legacy.data;
            run.globals = legacy.global;
            run.exportGlobals = legacy.exportGlobals;
            run.delay = legacy.delay;
            run.requestTimeout = legacy.requestTimeout;
            run.avoidRedirects = legacy.avoidRedirects;
            run.noSummary = legacy.noSummary;
            run.iterationCount = legacy.number;
            run.noColor = legacy.noColor || legacy.whiteScreen;
            run.disableUnicode = legacy.noTestSymbols;
            run.insecure = legacy.insecure;
            run.tls = legacy.tls;
            run.encoding = legacy.encoding;

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
        // load collection file (if any)
        function (options, cb) {
            return (_.has(options.run, 'collection') &&
            options.run.collection) ? fetch(options.run.collection, function (err, data) {
                if (err) {
                    return cb(err);
                }
                options.run.collection = data;
                return cb(null, options);
            }) : cb(null, options);
        },
        // load environment file (if any)
        function (options, cb) {
            return (_.has(options.run, 'environment') &&
            options.run.environment) ? fetch(options.run.environment, function (err, data) {
                if (err) {
                    return cb(err);
                }
                options.run.environment = data;
                return cb(null, options);
            }) : cb(null, options);
        },
        // load globals file (if any)
        function (options, cb) {
            return (_.has(options.run, 'globals') &&
            options.run.globals) ? fetch(options.run.globals, function (err, data) {
                if (err) {
                    return cb(err);
                }
                options.run.globals = data;
                return cb(null, options);
            }) : cb(null, options);
        },
        // Load a data file (if any)
        function (options, cb) {
            return (_.has(options.run, 'data') &&
            options.run.globals) ? fetch(options.run.data, function (err, data) {
                if (err) {
                    return cb(err);
                }
                options.run.data = data;
                return cb(null, options);
            }) : cb(null, options);
        }
    ], callback);
};

module.exports.rawOptions = rawOptions;
