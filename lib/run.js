var _ = require('lodash'),
    EventEmitter = require('eventemitter3'),
    runtime = require('postman-runtime'),
    RunSummary = require('./summary'),
    Collection = require('postman-collection').Collection,

    runtimeEvents = ['start', 'beforeIteration', 'beforeItem', 'beforePrerequest', 'prerequest',
        'beforeRequest', 'request', 'beforeTest', 'test', 'item', 'iteration', 'beforeScript', 'script', 'console',
        'exception', 'done'],

    /**
     * Accepts an object, and extracts the property inside an object which is supposed to contain a list of variables
     *
     * @param {Object} source
     * @param {String} type - "environment" or "globals", etc
     *
     * @returns {Object}
     */
    extractVariables = function (source, type) {
        if (!_.isObject(source && (source = source[type]))) { return; } // get hold of the object that holds ariable

        // ensure we unbox the JSON if it comes from cloud-api or similar sources
        !source.values && _.isObject(source[type]) && (source = source[type]);

        // ensure we handle environment sent in form of array of values
        (source.name && _.isArray(source.values)) && (source = source.values);

        // we ensure that environment passed as array is converted to plain object. runtime does this too, but we do it
        // here for consistency of options passed to reporters
        return _.isArray(source) ? _(source).keyBy('key').mapValues('value').value() : source;
    };

/**
 * @param {Object} options
 * @param {Collection|Object} options.collection
 * @param {Object} options.environment
 * @param {Array|String} options.reporters
 * @param {Function} callback
 *
 * @returns {EventEmitter}
 */
module.exports = function (options, callback) {
    // validate all options. it is to be notet that `options` parameter is option and is polymorphic
    (!callback && _.isFunction(options)) && (
        (callback = options),
        (options = {})
    );
    options = _.isObject(options) ? _.clone(options) : {}; // we initialise this as object to avoid needless validations
    !_.isFunction(callback) && (callback = _.noop);

    // create a collection in case it is not one. user can send v2 JSON as a source and that will be converted
    // to a collection
    if (_.isPlainObject(options.collection) && !Collection.isCollection(options.collection)) {
        options.collection = new Collection(options.collection);
    }

    // we sanitise the environment and globals and mutate the original otions so that subsequent consumers do not need
    // to do this again
    _.assign(options, {
        environment: extractVariables(options, 'environment'),
        globals: extractVariables(options, 'globals')
    });

    var emitter = new EventEmitter(), // @todo: create a new inherited constructor
        runner = new runtime.Runner();

    // ensure that the collection option is present before starting a run
    if (!_.isObject(options.collection)) {
        callback(new Error('newman: expecting a collection to run'));
        return emitter;
    }

    // store summary object and other relevant information inside the emitter
    emitter.summary = new RunSummary(emitter, options);

    options.collection && runner.run(options.collection, {
        abortOnError: options.abortOnError, // todo: could be a better name, especially in the CLI.
        iterationCount: options.iterationCount,
        environment: options.environment,
        globals: options.globals
    }, function (err, run) {
        var callbacks = {},
            // ensure that the reporter option type polymorphism is handled
            reporters = _.isString(options.reporters) ? [options.reporters] : options.reporters;

        // emit events for all the callbacks triggered by the runtime
        runtimeEvents.forEach(function (eventName) {
            callbacks[eventName] = emitter.emit.bind(emitter, eventName);
        });

        // override the `done` event to fire the end callback
        callbacks.done = function (err) { // @todo - do some meory cleanup here?
            callback(err);
            emitter.emit('done', err); // we now trigger the actual done event which we had overridden
        };

        // initialise all the reporters
        _.isArray(reporters) && _.each(reporters, function (reporterName) {
            // @todo validate reporter name to exist
            // @todo look up for node module "newman-reporter-" as reporters if one is not found locally
            // @todo sanitise the reporter name for security reasons
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
