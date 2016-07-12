var EventEmitter = require('eventemitter3'),
    runtime = require('postman-runtime'),

    runtimeEvents = ['start', 'beforeIteration', 'beforeItem', 'beforePrerequest', 'prerequest',
        'beforeRequest', 'request', 'beforeTest', 'test', 'item', 'iteration', 'beforeScript', 'script', 'console',
        'exception', 'done'];

/**
 * @param {Object} options
 * @param {Collection} options.collection
 * @param {Array|String} options.reporter
 * @param {Function} callback
 *
 * @returns {EventEmitter}
 */
module.exports = function (options, callback) {
    // validate all options. it is to be notet that `options` parameter is option and is polymorphic
    (!callback && typeof options === 'function') && (
        (callback = options),
        (options = {})
    );
    (!options) && (options = {}); // we initialise this as object to avoid needless validations

    var emitter = new EventEmitter(), // @todo: create a new inherited constructor
        runner = new runtime.Runner();

    if (!options.collection) {
        (typeof callback === 'function') && callback(new Error('newman: expecting a collection to run'));
    }

    options.collection && runner.run(options.collection, {}, function (err, run) {
        var callbacks = {};

        // emit events for all the callbacks triggered by the runtime
        runtimeEvents.forEach(function (eventName) {
            callbacks[eventName] = emitter.emit.bind(emitter, eventName);
        });

        // override the `done` event to fire the end callback
        callbacks.done = function (err) { // @todo - do some meory cleanup here?
            (typeof callback === 'function') && callback(err);
            emitter.emit('done', err); // we now trigger the actual done event which we had overridden
        };

        // ensure that the reporter option type polymorphism is handled
        (typeof options.reporter === 'string') && (options.reporter = [options.reporter]);

        // initialise all the reporters
        Array.isArray(options.reporter) && options.reporter.forEach(function (reporterName) {
            // @todo
            // - validate reporter name to exist
            // - look up for node module "newman-reporter-" as reporters if one is not found locally
            // - sanitise the reporter name for security reasons
            (emitter.reporters || (emitter.reporters = {}))[reporterName] =
                new (require('./reporters/' + reporterName))(emitter, options);
        });

        // we ensure that everything is async to comply with event paradigm and start the run
        setImmediate(function () {
            run.start(callbacks);
        });
    });

    return emitter;
};
