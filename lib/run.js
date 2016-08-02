var _ = require('lodash'),

    EventEmitter = require('eventemitter3'),
    runtime = require('postman-runtime'),
    RunSummary = require('./summary'),
    config = require('./config'),
    runConfig = require('./run-config'),

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
    defaultReporters = _.mapValues({
        cli: './reporters/cli',
        html: './reporters/html'
    }, require.bind(this));

/**
 * @param {Object} options
 * @param {Collection|Object} options.collection
 * @param {Object} options.environment
 * @param {Object} options.globals
 * @param {Object} options.iterationData
 * @param {Array|String} options.reporters
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
    config.get(options, { loaders: runConfig.configLoaders, command: 'run' }, function (err, options) {
        if (err) {
            return callback(err);
        }

        // ensure that the collection option is present before starting a run
        if (!_.isObject(options.collection)) {
            return callback(new Error('newman: expecting a collection to run'));
        }

        // store summary object and other relevant information inside the emitter
        emitter.summary = new RunSummary(emitter, options);

        // now start the run!
        runner.run(options.collection, {
            abortOnFailure: options.abortOnError, // todo: could be a better name, especially in the CLI.
            iterationCount: options.iterationCount,
            environment: options.environment,
            globals: options.globals,
            entrypoint: options.folder,
            data: options.iterationData,
            // todo: add support for more types of timeouts, currently only request is supported
            timeout: options.timeoutRequest ? { request: options.timeoutRequest } : undefined,
            requester: {
                followRedirects: _.has(options, 'ignoreRedirects') ? !options.ignoreRedirects : undefined,
                strictSSL: _.has(options, 'insecure') ? !options.insecure : undefined
            }
        }, function (err, run) {
            var callbacks = {},
                // ensure that the reporter option type polymorphism is handled
                reporters = _.isString(options.reporters) ? [options.reporters] : options.reporters;

            // emit events for all the callbacks triggered by the runtime
            _.each(runtimeEvents, function (definition, eventName) {

                // intercept each runtime.* callback and expose a global object based event
                callbacks[eventName] = function (err, cursor) {
                    var args = arguments,
                        obj = { cursor: cursor };

                    // convert the arguments into an object by taking the key name reference from the definition
                    // object
                    _.each(definition, function (key, index) {
                        obj[key] = args[index + 2]; // first two are err, cursor
                    });

                    args = [eventName, err, obj];
                    emitter.emit.apply(emitter, args); // eslint-disable-line prefer-spread
                };
            });

            // add non generic callback handling
            _.extend(callbacks, {
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
                    // we emit a `beforeDone` event so that reporters and other such addons can do computation before
                    // the run is marked as done
                    emitter.emit('beforeDone', err, {
                        cursor: cursor,
                        summary: emitter.summary
                    });

                    // @todo - do export handling here

                    // we now trigger actual done event which we had overridden
                    emitter.emit('done', err, emitter.summary);
                    callback(err, emitter.summary);
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

                _.each(_.get(o.execution, 'globals.tests'), function (passed, assertion) {
                    emitter.emit('assertion', (passed ? null : {
                        name: 'AssertionFailure',
                        index: index,
                        message: assertion,

                        stack: 'AssertionFailure: Expected tests["' + assertion + '"] to be truth-like\n' +
                            '   at Object.eval test.js:' + (index + 1) + ':' +
                            ((o.cursor && o.cursor.position || 0) + 1) + ')'
                    }), _.extend({ assertion: assertion }, o));
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
            _.isArray(reporters) && _.each(reporters, function (reporterName) {
                if (_.has(emitter.reporters, reporterName)) { return; }


                var Reporter = defaultReporters[reporterName];

                // check if the reporter is not a local reporter, then load an external reporter
                if (!Reporter) {
                    try { Reporter = require('newman-reporter-' + reporterName); }
                    // we suppress this error since, the check of missing error is done later
                    // @todo - maybe have a debug mode and log error there
                    catch (error) { } // eslint-disable-line no-empty
                }

                try {
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

            // we ensure that everything is async to comply with event paradigm and start the run
            setImmediate(function () {
                run.start(callbacks);
            });
        });
    });

    return emitter;
};
