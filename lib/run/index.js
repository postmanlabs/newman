var fs = require('fs'),
    _ = require('lodash'),
    asyncEach = require('async/each'),
    EventEmitter = require('eventemitter3'),
    runtime = require('postman-runtime'),
    util = require('../util'),
    exportFile = require('./export-file'),
    RunSummary = require('./summary'),
    getOptions = require('./options'),
    request = require('postman-request'),

    // This object describes the various events raised by Newman, and what each event argument contains.
    // Error and cursor are present in all events.
    runtimeEvents = {
        start: [],
        beforeIteration: [],
        beforeItem: ['item'],
        beforePrerequest: ['events', 'item'],
        prerequest: ['executions', 'item'],
        beforeRequest: ['request', 'item'],
        request: ['response', 'request', 'item'],
        beforeTest: ['events', 'item'],
        test: ['executions', 'item'],
        item: ['item'],
        iteration: [],
        beforeScript: ['script', 'event', 'item'],
        script: ['execution', 'script', 'event', 'item']
    },

    // load all the default reporters here. if you have new reporter, add it to this list
    // we know someone, who does not like dynamic requires
    defaultReporters = {
        cli: require('../reporters/cli'),
        json: require('../reporters/json'),
        html: require('../reporters/html'),
        junit: require('../reporters/junit'),
        progress: require('../reporters/progress'),
        emojitrain: require('../reporters/emojitrain')
    };

/**
 * @param {Object} options
 * @param {Collection|Object} options.collection
 * @param {Object} options.environment
 * @param {Object} options.globals
 * @param {Object} options.iterationData
 * @param {Array|String} options.reporters
 * @param {String} options.exportGlobals
 * @param {String} options.exportEnvironment
 * @param {String} options.exportCollection
 * @param {Function} callback
 *
 * @returns {EventEmitter}
 */
module.exports = function (options, callback) {
    // validate all options. it is to be noted that `options` parameter is option and is polymorphic
    (!callback && _.isFunction(options)) && (
        (callback = options),
        (options = {})
    );
    !_.isFunction(callback) && (callback = _.noop);

    var emitter = new EventEmitter(), // @todo: create a new inherited constructor
        runner = new runtime.Runner();

    // get the configuration from various sources
    getOptions(options, function (err, options) {
        if (err) {
            return callback(err);
        }

        // ensure that the collection option is present before starting a run
        if (!_.isObject(options.collection)) {
            return callback(new Error('newman: expecting a collection to run'));
        }

        // store summary object and other relevant information inside the emitter
        emitter.summary = new RunSummary(emitter, options);

        // to store the exported content from reporters
        emitter.exports = [];

        // now start the run!
        runner.run(options.collection, {
            stopOnFailure: options.bail, // LOL, you just got trolled ¯\_(ツ)_/¯
            abortOnFailure: options.abortOnFailure, // used in integration tests, to be considered for a future release
            iterationCount: options.iterationCount || _.get(options, 'iterationData.length'),
            environment: options.environment,
            globals: options.globals,
            entrypoint: options.folder,
            data: options.iterationData,
            delay: {
                item: options.delayRequest
            },
            // todo: add support for more types of timeouts, currently only request is supported
            timeout: options.timeoutRequest ? { request: options.timeoutRequest } : undefined,
            requester: {
                fileResolver: fs,
                cookieJar: request.jar(),
                followRedirects: _.has(options, 'ignoreRedirects') ? !options.ignoreRedirects : undefined,
                strictSSL: _.has(options, 'insecure') ? !options.insecure : undefined
            }
        }, function (err, run) {
            var callbacks = {},
                // ensure that the reporter option type polymorphism is handled
                reporters = _.isString(options.reporters) ? [options.reporters] : options.reporters;

            // emit events for all the callbacks triggered by the runtime
            _.forEach(runtimeEvents, function (definition, eventName) {
                // intercept each runtime.* callback and expose a global object based event
                callbacks[eventName] = function (err, cursor) {
                    var args = arguments,
                        obj = { cursor: cursor };

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
                // bubble up the console messages
                console: function (cursor, level) {
                    emitter.emit('console', null, {
                        cursor: cursor,
                        level: level,
                        messages: _.slice(arguments, 2)
                    });
                },
                // @todo fix bug of arg order in runtime
                exception: function (cursor, err) {
                    emitter.emit('exception', null, {
                        cursor: cursor,
                        error: err
                    });
                },
                // override the `done` event to fire the end callback
                done: function (err, cursor) { // @todo - do some memory cleanup here?
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

                    _.forEach(['environment', 'globals', 'collection'], function (item) {
                        // fetch the path name from options if one is provided
                        var path = _.get(options, _.camelCase(`export-${item}`));

                        // if the options have an export path, then add the item to export queue
                        path && emitter.exports.push({
                            name: item,
                            default: `newman-${item}.json`,
                            path: path,
                            content: _.merge(emitter.summary[item].toJSON(), {
                                _postman_exported_at: (new Date()).toISOString(),
                                _postman_exported_using: util.userAgent
                            })
                        });
                    });

                    asyncEach(emitter.exports, exportFile, function (err) {
                        // we now trigger actual done event which we had overridden
                        emitter.emit('done', err, emitter.summary);
                        callback(err, emitter.summary);
                    });
                }
            });

            // generate pseudo assertion events since runtime does not trigger assertion events yet.
            // without this, all reporters would needlessly need to extract assertions and create an error object
            // out of it
            emitter.on('script', function (err, o) {
                // we iterate on each test assertion to trigger an event. during this, we create a pseudo error object
                // for the assertion
                var index = 0,
                    type = o && o.event && o.event.listen;

                _.forEach(_.get(o.execution, 'globals.tests'), function (passed, assertion) {
                    emitter.emit('assertion', (passed ? null : {
                        name: 'AssertionFailure',
                        index: index,
                        message: assertion,

                        stack: 'AssertionFailure: Expected tests["' + assertion + '"] to be truth-like\n' +
                            '   at Object.eval test.js:' + (index + 1) + ':' +
                            ((o.cursor && o.cursor.position || 0) + 1) + ')'
                    }), _.assignIn({ assertion: assertion }, o));
                    index += 1;
                });

                // bubble special script name based events
                type && emitter.emit(type + 'Script', err, o);
            });

            emitter.on('beforeScript', function (err, o) {
                // bubble special script name based events
                o && o.event && o.event && emitter.emit(_.camelCase('before-' + o.event.listen + 'Script'), err, o);
            });

            // initialise all the reporters
            !emitter.reporters && (emitter.reporters = {});
            _.isArray(reporters) && _.forEach(reporters, function (reporterName) {
                // disallow duplicate reporter initialisation
                if (_.has(emitter.reporters, reporterName)) { return; }

                var Reporter = defaultReporters[reporterName];

                // check if the reporter is not a local reporter, then load an external reporter
                if (!Reporter) {
                    try {
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
                    // we suppress this error since, the check of missing error is done later
                    // @todo - maybe have a debug mode and log error there
                    catch (error) { } // eslint-disable-line no-empty
                }

                try {
                    // we could have checked _.isFunction(Reporter), here, but we do not do that so that the nature of
                    // reporter error can be bubbled up
                    Reporter && (emitter.reporters[reporterName] = new Reporter(emitter,
                        _.get(options, 'reporter.' + reporterName, {}), options));
                }
                catch (error) {
                    // if the reporter errored out during initialisation, we should not stop the run simply log
                    // the error stack trace for debugging
                    // @todo: route this via print module to respect silent flags
                    console.warn(error);
                }

                // if the reporter is not loaded then we need to warn users
                if (!(_.isFunction(Reporter) && _.isObject(emitter.reporters[reporterName]))) {
                    // @todo: route this via print module to respect silent flags
                    console.warn(`newman warning: "${reporterName}" reporter could not be loaded.`);
                }
            });

            // raise warning when more than one dominant reporters are used
            (function (reporters) {
                // find all reporters whose `dominant` key is set to true
                var conflicts = _.keys(_.transform(reporters, function (conflicts, reporter, name) {
                    reporter.dominant && (conflicts[name] = true);
                }));

                (conflicts.length > 1) && // if more than one dominant, raise a warning
                    console.warn(`newman warning: ${conflicts.join(', ')} reporters might not work well together.`);
            }(emitter.reporters));

            // we ensure that everything is async to comply with event paradigm and start the run
            setImmediate(function () {
                run.start(callbacks);
            });
        });
    });

    return emitter;
};
