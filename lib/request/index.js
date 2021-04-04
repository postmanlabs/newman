var _ = require('lodash'),
    asyncEach = require('async/each'),
    sdk = require('postman-collection'),
    runtime = require('postman-runtime'),
    EventEmitter = require('eventemitter3'),
    //todo: re-write summary for request command
    RunSummary = require('../run/summary'),
    getOptions = require('./options'),
    exportFile = require('../run/export-file'),

    /**
     * This object describes the various events raised by Newman, and what each event argument contains.
     * Error and cursor are present in all events.
     *
     * @type {Object}
     */
    //todo: add special events for request command
    runtimeEvents = {
        start: [],
        beforeIteration: [],
        beforeItem: ['item'],
        beforePrerequest: ['events', 'item'],
        prerequest: ['executions', 'item'],
        beforeRequest: ['request', 'item'],
        request: ['response', 'request', 'item', 'cookies', 'history'],
        beforeTest: ['events', 'item'],
        test: ['executions', 'item'],
        item: ['item'],
        iteration: [],
        beforeScript: ['script', 'event', 'item'],
        script: ['execution', 'script', 'event', 'item']
    },

    /**
     * load all the default reporters here. if you have new reporter, add it to this list
     * we know someone, who does not like dynamic requires
     *
     * @type {Object}
     */
    //todo: change cli output to single request 
    defaultReporters = {
        cli: require('../reporters/cli'),
        json: require('../reporters/json'),
        junit: require('../reporters/junit'),
        progress: require('../reporters/progress'),
        emojitrain: require('../reporters/emojitrain')
    },

    /**
     * The object of known reporters and their install instruction in case the reporter is not loaded.
     * Pad message with two spaces since its a follow-up message for reporter warning.
     *
     * @private
     * @type {Object}
     */
    knownReporterErrorMessages = {
        html: '  run `npm install newman-reporter-html`\n',
        teamcity: '  run `npm install newman-reporter-teamcity`\n'
    };

/**
 * Runs a single request, with all the provided options, returning an EventEmitter.
 *
 * @param {Object} options - The set of wrapped options, passed by the CLI parser.
 * @param {String} options.curl - Curl command representing the collection with a single request.
 * @param {Object|String} options.reporters - A set of reporter names and their associated options for the current run.
 * @param {Function} callback - The callback function invoked to mark the end of the collection run.
 * @returns {EventEmitter} - An EventEmitter instance with done and error event attachments.
 */
module.exports = function (options, callback) {
    // validate all options. it is to be noted that `options` parameter is option and is polymorphic
    (!callback && _.isFunction(options)) && (
        (callback = options),
        (options = {})
    );
    !_.isFunction(callback) && (callback = _.noop);

    var emitter = new EventEmitter(), // @todo: create a new inherited constructor
        runner = new runtime.Runner(),
        stopOnFailure;

    // get the configuration from various sources
    getOptions(options, function (err, options) {
        if (err) {
            return callback(err);
        }

        // ensure that the curl is present before starting a run
        if (!_.isObject(options.curl) && !sdk.Collection.isCollection(options.curl)) {
            return callback(new Error('expecting valid curl-like options'));
        }

        // store summary object and other relevant information inside the emitter
        emitter.summary = new RunSummary(emitter, options);

        // to store the exported content from reporters
        emitter.exports = [];

        // now start the run!
        runner.run(options.curl, {
            stopOnFailure: stopOnFailure, // LOL, you just got trolled ¯\_(ツ)_/¯
            requester: {
                useWhatWGUrlParser: true,
                timings: Boolean(options.verbose),
            }
        }, function (err, run) {
            if (err) { return callback(err); }

            var callbacks = {},
                // ensure that the reporter option type polymorphism is handled
                reporters = _.isString(options.reporters) ? [options.reporters] : options.reporters,
                // keep a track of start assertion indices of legacy assertions
                legacyAssertionIndices = {};

            // emit events for all the callbacks triggered by the runtime
            _.forEach(runtimeEvents, function (definition, eventName) {
                // intercept each runtime.* callback and expose a global object based event
                callbacks[eventName] = function (err, cursor) {
                    var args = arguments,
                        obj = { cursor };

                    // convert the arguments into an object by taking the key name reference from the definition
                    // object
                    _.forEach(definition, function (key, index) {
                        obj[key] = args[index + 2]; // first two are err, cursor
                    });

                    args = [eventName, err, obj];
                    emitter.emit.apply(emitter, args); // eslint-disable-line prefer-spread
                };
            });

            // add non generic callback handling
            _.assignIn(callbacks, {

                /**
                 * Bubbles up console messages.
                 *
                 * @param {Object} cursor - The run cursor instance.
                 * @param {String} level - The level of console logging [error, silent, etc].
                 * @returns {*}
                 */
                console (cursor, level) {
                    emitter.emit('console', null, {
                        cursor: cursor,
                        level: level,
                        messages: _.slice(arguments, 2)
                    });
                },

                /**
                 * The exception handler for the current run instance.
                 *
                 * @todo Fix bug of arg order in runtime.
                 * @param {Object} cursor - The run cursor.
                 * @param {?Error} err - An Error instance / null object.
                 * @returns {*}
                 */
                exception (cursor, err) {
                    emitter.emit('exception', null, {
                        cursor: cursor,
                        error: err
                    });
                },

                assertion (cursor, assertions) {
                    _.forEach(assertions, function (assertion) {
                        var errorName = _.get(assertion, 'error.name', 'AssertionError');

                        !assertion && (assertion = {});

                        // store the legacy assertion index
                        assertion.index && (legacyAssertionIndices[cursor.ref] = assertion.index);

                        emitter.emit('assertion', (assertion.passed ? null : {
                            name: errorName,
                            index: assertion.index,
                            test: assertion.name,
                            message: _.get(assertion, 'error.message', assertion.name || ''),

                            stack: errorName + ': ' + _.get(assertion, 'error.message', '') + '\n' +
                                '   at Object.eval sandbox-script.js:' + (assertion.index + 1) + ':' +
                                ((cursor && cursor.position || 0) + 1) + ')'
                        }), {
                            cursor: cursor,
                            assertion: assertion.name,
                            skipped: assertion.skipped,
                            error: assertion.error,
                            item: run.resolveCursor(cursor)
                        });
                    });
                },

                /**
                 * Custom callback to override the `done` event to fire the end callback.
                 *
                 * @todo Do some memory cleanup here?
                 * @param {?Error} err - An error instance / null passed from the done event handler.
                 * @param {Object} cursor - The run instance cursor.
                 * @returns {*}
                 */
                done (err, cursor) {
                    // in case runtime faced an error during run, we do not process any other event and emit `done`.
                    // we do it this way since, an error in `done` callback would have anyway skipped any intermediate
                    // events or callbacks
                    if (err) {
                        emitter.emit('done', err, emitter.summary);
                        callback(err, emitter.summary);

                        return;
                    }

                    // we emit a `beforeDone` event so that reporters and other such addons can do computation before
                    // the run is marked as done
                    emitter.emit('beforeDone', null, {
                        cursor: cursor,
                        summary: emitter.summary
                    });


                    asyncEach(emitter.exports, exportFile, function (err) {
                        // we now trigger actual done event which we had overridden
                        emitter.emit('done', err, emitter.summary);
                        callback(err, emitter.summary);
                    });
                }
            });

            emitter.on('script', function (err, o) {
                // bubble special script name based events
                o && o.event && emitter.emit(o.event.listen + 'Script', err, o);
            });

            emitter.on('beforeScript', function (err, o) {
                // bubble special script name based events
                o && o.event && emitter.emit(_.camelCase('before-' + o.event.listen + 'Script'), err, o);
            });

            // initialise all the reporters
            !emitter.reporters && (emitter.reporters = {});
            _.isArray(reporters) && _.forEach(reporters, function (reporterName) {
                // disallow duplicate reporter initialisation
                if (_.has(emitter.reporters, reporterName)) { return; }

                var Reporter;

                try {
                    // check if the reporter is an external reporter
                    Reporter = require((function (name) { // ensure scoped packages are loaded
                        var prefix = '',
                            scope = (name.charAt(0) === '@') && name.substr(0, name.indexOf('/') + 1);

                        if (scope) {
                            prefix = scope;
                            name = name.substr(scope.length);
                        }

                        return prefix + 'newman-reporter-' + name;
                    }(reporterName)));
                }
                // @todo - maybe have a debug mode and log error there
                catch (error) {
                    if (!defaultReporters[reporterName]) {
                        // @todo: route this via print module to respect silent flags
                        console.warn(`newman: could not find "${reporterName}" reporter`);
                        console.warn('  ensure that the reporter is installed in the same directory as newman');

                        // print install instruction in case a known reporter is missing
                        if (knownReporterErrorMessages[reporterName]) {
                            console.warn(knownReporterErrorMessages[reporterName]);
                        }
                        else {
                            console.warn('  please install reporter using npm\n');
                        }
                    }
                }

                // load local reporter if its not an external reporter
                !Reporter && (Reporter = defaultReporters[reporterName]);

                try {
                    // we could have checked _.isFunction(Reporter), here, but we do not do that so that the nature of
                    // reporter error can be bubbled up
                    Reporter && (emitter.reporters[reporterName] = new Reporter(emitter,
                        _.get(options, ['reporter', reporterName], {}), options));
                }
                catch (error) {
                    // if the reporter errored out during initialisation, we should not stop the run simply log
                    // the error stack trace for debugging
                    console.warn(`newman: could not load "${reporterName}" reporter`);

                    if (!defaultReporters[reporterName]) {
                        // @todo: route this via print module to respect silent flags
                        console.warn(`  this seems to be a problem in the "${reporterName}" reporter.\n`);
                    }
                    console.warn(error);
                }
            });

            // raise warning when more than one dominant reporters are used
            (function (reporters) {
                // find all reporters whose `dominant` key is set to true
                var conflicts = _.keys(_.transform(reporters, function (conflicts, reporter, name) {
                    reporter.dominant && (conflicts[name] = true);
                }));

                (conflicts.length > 1) && // if more than one dominant, raise a warning
                    console.warn(`newman: ${conflicts.join(', ')} reporters might not work well together.`);
            }(emitter.reporters));

            // we ensure that everything is async to comply with event paradigm and start the run
            setImmediate(function () {
                run.start(callbacks);
            });
        });
    });

    return emitter;
};
