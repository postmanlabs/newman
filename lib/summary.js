var _ = require('lodash'),
    SerialiseError = require('serialised-error'),

    RunSummary;

/**
 * @constructor
 * @param {EventEmitter} emitter
 * @param {Object} options
 */
RunSummary = function RunSummary (emitter, options) {
    // keep a copy of this instance since, we need to refer to this from various events
    var summary = this;

    // and store the trackers and failures in the summary object itself
    _.assign(summary, /** @lends RunSummary.prototype */ {
        /**
         * Generic information about a collection run
         *
         * @type {Object}
         */
        info: {
            /**
             * The ID of the collection being run
             *
             * @type {String}
             */
            collectionId: _.get(options, 'collection.id'),

            /**
             * The name of the collection being run
             *
             * @type {String}
             */
            collectionName: _.get(options, 'collection.name')
        },

        /**
         * The collection that is being executed.
         *
         * @type {Collection}
         */
        collection: _.get(options, 'collection'),

        /**
         * The environment that is being used during the run
         *
         * @type {VariableList}
         */
        environment: {
            /**
             * Get an object containing a copy of all environment variables and their values
             *
             * @type {Function}
             * @returns {Object<String>}
             */
            object: function () {
                return _.get(options, 'environment', {});
            }
        },

        /**
         * Environment variables being used during the run
         *
         * @type {VariableList}
         */
        global: {
            /**
             * Get an object containing a copy of all global variables and their values
             *
             * @type {Function}
             * @returns {Object<String>}
             */
            object: function () {
                return _.get(options, 'globals', {});
            }
        },

        /**
         * Holds the statistics of the run. Each property in it is the item being tracked and has three numeric
         * properties - total, failed, pending
         *
         * @type {Object.<Object>}
         */
        stats: {
            iterations: {},
            items: {},
            scripts: {},
            prerequests: {},
            requests: {},
            tests: {},
            assertions: {},
            testScripts: {},
            prerequestScripts: {}
        },

        /**
         * Stores all generic timing information
         *
         * @type {Object}
         */
        timings: {
            /**
             * The average response time of the run
             *
             * @type {number}
             */
            responseAverage: 0
        },

        /**
         * Stores information on data transfer made during the collection
         *
         * @type {Object}
         */
        transfers: {
            /**
             * The total data received as response to every request
             *
             * @type {number}
             */
            responseTotal: 0
        },

        /**
         * An array of all errors encountered during the run
         *
         * @type {Array.<Error>}
         */
        failures: [],

        /**
         * This stores any fatal error during the run that caused the run to abort prematurely.
         *
         * @type {Error}
         */
        error: null
    });

    // track run timings (start and end)
    RunSummary.attachTimingTrackers(this, emitter);

    // accumulate statistics on all event
    // for all types of events track the counters for the event and its corresponding "before" counterpart
    RunSummary.attachStatisticTrackers(this, emitter);

    // accumulate statistics on requests - such as size and time
    RunSummary.attachRequestTracker(this, emitter);

    // accumulate errors (failures) from all events
    RunSummary.attachFailureTrackers(this, emitter);

    // accumulate all execution specific data in collection
    RunSummary.attachReportingTrackers(this, emitter);
};

_.assign(RunSummary, {
    attachReportingTrackers: function (summary, emitter) {
        /**
         * Fetches the execution storage object for an item (or any other SDK instance).
         *
         * @param {Object} obj
         * @param {Object} cursor
         * @param {Object=} [defaults]
         *
         * @returns {Object}
         */
        var getExecution = function (obj, cursor, defaults) {
            if (!(obj && cursor)) { return undefined; }
            !obj._postman_iterations && (obj._postman_iterations = []);

            return _.merge(obj._postman_iterations[cursor.iteration] ||
                (obj._postman_iterations[cursor.iteration] = {}), defaults);
        };

        // save all responses in original item
        emitter.on('request', function (err, o) {
            o && getExecution(o.item, o.cursor, {
                request: o.request,
                response: o.response,
                requestError: err
            });
        });

        // save all script execution errors in each execution
        emitter.on('script', function (err, o) {
            var execution = o && getExecution(o.item, o.cursor),
                eventName = o && o.event && (o.event.listen + 'Script');

            // store the script error corresponding to the script event name
            (execution && eventName) && (execution[eventName] || (execution[eventName] = [])).push({
                error: err
            });
        });

        // save all assertions in each execution
        emitter.on('assertion', function (err, o) {
            var execution = o && getExecution(o.item, o.cursor);
            if (!execution) { return; }

            (execution.assertions || (execution.assertions = [])).push({
                assertion: o.assertion,
                error: err
            });
        });
    },

    attachTimingTrackers: function (summary, emitter) {
        // mark the point when the run started
        // also mark the point when run completed and also store error if needed
        emitter.on('start', function () { summary.timings.started = Date.now(); });
        emitter.on('done', function (err) {
            summary.timings.completed = Date.now();
            err && (summary.error = err);
        });
    },
    attachStatisticTrackers: function (summary, emitter) {
        // accumulate statistics on all event
        // for all types of events track the counters for the event and its corresponding "before" counterpart
        _.each(summary.stats, function (tracker, name) {
            // the actual event names are singular than their plural trackers, so we make the name singular
            name = name.slice(0, -1); // remove last character

            // populate initial values of trackers
            _.assign(tracker, { total: 0, pending: 0, failed: 0 });

            // Set up common listeners for a set of events, which tracks how many times they were executed and records
            // the ones which had an error passed as first argument
            emitter.on(_.camelCase('before-' + name), function () {
                tracker.pending += 1;
            });

            emitter.on(name, function (err) {
                // check pending so that, it does not negate for items that do not have a `before` counterpart
                tracker.pending && (tracker.pending -= 1);
                err && (tracker.failed += 1);
                tracker.total += 1;
            });
        });
    },

    attachRequestTracker: function (summary, emitter) {
        // accumulate statistics on requests
        emitter.on('request', function (err, o) {
            if (err || !(o && o.response)) { return; }

            var size = _.isFunction(o.response.size) && o.response.size(),
                time = o.response.responseTime,

                requestCount = summary.stats.requests.total;

            // compute the response size total
            size && (summary.transfers.responseTotal += (size.body || 0 + size.headers || 0));

            // compute average response time
            time && (summary.timings.responseAverage =
                ((summary.timings.responseAverage * (requestCount - 1) + time) / requestCount));
        });
    },

    attachFailureTrackers: function (summary, emitter) {
        var eventsToTrack = ['beforeIteration', 'iteration', 'beforeItem', 'item', 'beforeScript', 'script',
            'beforePrerequest', 'prerequest', 'beforeRequest', 'request', 'beforeTest', 'test', 'beforeAssertion',
            'assertion'];

        // accumulate failures of all events
        // NOTE that surrogate events (which throw duplicate arguments) are not recorded
        _.each(eventsToTrack, function (event) {
            // push failures sent from "before" events
            emitter.on(event, function (err, o) {
                if (!err) { return; }

                var item = o && o.item,
                    source = event;

                // in case of user script error, point to the line and column of the script and its type
                if (event === 'script') {
                    o.event && (source = o.event.listen + '-script');
                    if (err.stacktrace && err.stacktrace[0] && err.stacktrace[0].lineNumber) {
                        source += (':' + (err.stacktrace[0].lineNumber - 2));
                        err.stacktrace[0].columnNumber && (source += (':' + err.stacktrace[0].columnNumber));
                    }
                }
                // assertion errors need to know which assertion in the test was this
                else if (event === 'assertion') {
                    _.has(err, 'index') && (source += (':' + (err.index + 1)));
                    source += ' in test-script';
                }

                // if this is a plain error, convert it to serialised error
                if (err.stack && !err.stacktrace) {
                    err = new SerialiseError(err, true);
                }

                summary.failures.push({
                    error: err,
                    at: source,
                    source: item ? (item.name || item.id) : '<unknown>',
                    parent: item && item.__parent && item.__parent.__parent || undefined,
                    cursor: o.cursor || {}
                });
            });
        });
    }
});

module.exports = RunSummary;
