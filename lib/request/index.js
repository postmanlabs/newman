const _ = require('lodash'),
    runtime = require('postman-runtime'),
    RunSummary = require('../run/summary'),
    EventEmitter = require('eventemitter3'),
    util = require('./util'),

    /**
     * This object describes the various events raised by Newman, and what each event argument contains.
     * Error and cursor are present in all events.
     *
     * @type {Object}
     */
    runtimeEvents = {
        start: [],
        beforeRequest: ['request', 'item'],
        request: ['response', 'request', 'item', 'cookies', 'history']
    },

    /**
     *All default reporters are loaded here.
     *
     * @type {object}
     */
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

module.exports = function (options, callback) {
    // validate all options. it is to be noted that `options` parameter is option and is polymorphic
    (!callback && _.isFunction(options)) && (
        (callback = options),
        (options = {})
    );
    !_.isFunction(callback) && (callback = _.noop);

    // ensure that the curl command is present before starting a run
    if (!_.isString(options.curl)) {
        return callback(new Error('expecting a valid curl command to run'));
    }

    const runner = new runtime.Runner(),
        emitter = new EventEmitter();

    // store summary object and other relevant information inside the emitter
    emitter.summary = new RunSummary(emitter, options);

    util.convertCurltoCollection(options.curl, function (err, curlCollection) {
        if (err) {
            return callback(err);
        }

        runner.run(curlCollection, {
            requester: {
                verbose: Boolean(options.verbose && options.singleRequest)
            }
        }, function (err, run) {
            if (err) {
                return callback(err);
            }

            const eventNames = Object.keys(runtimeEvents),
                // emit events for all the callbacks triggered by the runtime
                callbacks = eventNames.reduce(function (memo, eventName) {
                    const definition = runtimeEvents[eventName];

                    // intercept each runtime.* callback and expose a global object based event
                    memo[eventName] = function (err, cursor) {
                        let args = arguments;

                        // convert the arguments into an object by taking the key name reference from the definition
                        // object
                        const obj = definition.reduce(function (memo, key, index) {
                            memo[key] = args[index + 2]; // first is err and second is cursor

                            return memo;
                        }, { cursor });

                        args = [eventName, err, obj];
                        emitter.emit.apply(emitter, args); // eslint-disable-line prefer-spread
                    };

                    return memo;
                }, {});

            // Custom callback to override the `done` event to fire the end callback.
            callbacks.done = function (err) {
                // in case runtime faced an error during run, we do not process any other event and emit `done`.
                // we do it this way since, an error in `done` callback would have anyway skipped any intermediate
                // events or callbacks
                if (err) {
                    emitter.emit('done', err, emitter.summary);

                    return callback(err, emitter.summary);
                }

                // we now trigger actual done event which we had overridden
                emitter.emit('done', null, emitter.summary);
                callback(null, emitter.summary);
            };

            var reporters = _.isString(options.reporters) ? [options.reporters] : options.reporters;

            // initialize the reporters
            !emitter.reporters && (emitter.reporters = {});
            if (_.isArray(reporters)) {
                _.forEach(reporters, function (reporterName) {
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

                    Reporter && (emitter.reporters[reporterName] = new Reporter(emitter,
                        _.get(options, ['reporter', reporterName], {}), options));

                    // try {
                    //     // we could have checked _.isFunction(Reporter), here, but we do not do that
                    //     // so that the nature of reporter error can be bubbled up
                    //     Reporter && (emitter.reporters[reporterName] = new Reporter(emitter,
                    //         _.get(options, ['reporter', reporterName], {}), options));
                    // }
                    // catch (error) {
                    //     // if the reporter errored out during initialisation, we should not stop the run simply log
                    //     // the error stack trace for debugging
                    //     console.warn(`newman: could not load "${reporterName}" reporter`);
                    //
                    //     if (!defaultReporters[reporterName]) {
                    //         // @todo: route this via print module to respect silent flags
                    //         console.warn(`  this seems to be a problem in the "${reporterName}" reporter.\n`);
                    //     }
                    //     console.warn(error);
                    // }
                });
            }

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
};
