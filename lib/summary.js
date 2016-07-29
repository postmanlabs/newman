var _ = require('lodash'),
    SerialiseError = require('serialised-error'),

    RunSummary;

/**
 * @constructor
 * @param {EventEmitter} emitter
 * @param {Object} options
 * @note
 * The summary object looks somewhat like the following:
 * (
 *   iterations: { total: 1, pending: 0, failed: 0 },
 *   items: { total: 23, pending: 0, failed: 0 },
 *   scripts: { total: 24, pending: 0, failed: 3 },
 *   prerequests: { total: 23, pending: 0, failed: 0 },
 *   requests: { total: 23, pending: 0, failed: 0 },
 *   tests: { total: 23, pending: 0, failed: 0 },
 *   assertions: { total: 62, pending: 0, failed: 8 },
 *   failures: [{ source: 'DigestAuth Request', error: [Object] }]
 * }
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
};

_.assign(RunSummary, {
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

            var size = o.response.size(),
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
