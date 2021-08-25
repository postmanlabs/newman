const _ = require('lodash'),
    runtime = require('postman-runtime'),
    RunSummary = require('../run/summary'),
    EventEmitter = require('eventemitter3'),
    util = require('./util'),
    initReporters = require('../common/initReporters'),

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
    };

module.exports = function (options, callback) {
    // validate all options. it is to be noted that `options` parameter is option and is polymorphic
    (!callback && _.isFunction(options)) && (
        (callback = options),
        (options = {})
    );
    !_.isFunction(callback) && (callback = _.noop);

    const curl = util.createCurl(options),
        emitter = new EventEmitter(),
        runner = new runtime.Runner();

    options.curl = curl;
    options.singleRequest = true;

    // ensure that the curl command is present before starting a run
    if (!_.isString(options.curl)) {
        return callback(new Error('expecting a valid curl command to run'));
    }

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

            initReporters(options, emitter);

            // we ensure that everything is async to comply with event paradigm and start the run
            setImmediate(function () {
                run.start(callbacks);
            });
        });
    });

    return emitter;
};
