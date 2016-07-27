var _ = require('lodash'),
    sdk = require('postman-collection'),
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
    var summary = this,
        trackers;

    // execute `trackEvent` function to attach listeners and update the pass, fail and pending count of each event
    trackers = RunSummary.trackEvent(['iteration', 'item', 'script', 'prerequest', 'request', 'test', 'assertion',
        'testScript', 'prerequestScript'], emitter);

    // and store the trackers and failures in the summary object itself
    _.assign(summary, {
        stats: trackers.stats,
        failures: trackers.failures,
        // store little bits of information regarding the run within the `info` object
        info: {
            collectionId: _.get(options, 'collection.id'),
            collectionName: _.get(options, 'collection.name')
        },
        collection: new sdk.Collection(options.collection.toJSON())
    });

    RunSummary.buildReport(emitter, summary.collection);

    // mark the point when the run started
    // also mark the point when run completed and also store error if needed
    emitter.on('start', function () { summary.started = Date.now(); });
    emitter.on('done', function (err) {
        summary.completed = Date.now();
        err && (summary.error = err);
    });
};

/**
 * Attaches hooks to relevant events to build out a Collection, which has
 * test results populated inside it.
 *
 * @param emitter
 * @param report
 */
RunSummary.buildReport = function (emitter, report) {
    var currentIteration,
        currentItem;

    emitter.on('beforeIteration', function (err, args) {
        currentIteration = args.cursor.iteration;
    });

    emitter.on('beforeItem', function (err, args) {
        // todo: add a function in the sdk to recursively find an item in a
        // subfolder
        report.forEachItem(function (item) {
            (item.name === args.item.name) && (currentItem = item);
        });
        // Remove all the existing saved responses, so that each iteration
        // can have its own response.
        currentItem.responses.clear();
    });

    emitter.on('request', function (err, args) {
        if (err && !currentItem.error) {
            currentItem.error = err;
            return;
        }

        var response = args.response;
        response.originalRequest = args.request;
        currentItem.responses.add(args.response);
    });

    emitter.on('script', function (err) {
        if (err && !currentItem.error) {
            currentItem.error = err;
        }
    });

    emitter.on('assertion', function (err, args) {
        var results = currentItem.results = currentItem.results || {},
            iteration = results[currentIteration] = results[currentIteration] || {};
        iteration[args.assertion] = !err;
    });
};

/**
 * Sets up common listeners for a set of events, which tracks how many times they were executed and records the ones
 * which had an error passed as first argument
 *
 * @param {[type]} events [description]
 * @param {[type]} emitter [description]
 *
 * @returns {[type]} [description]
 */
RunSummary.trackEvent = function (events, emitter) {
    var trackers = {
        stats: {},
        failures: []
    };

    _.each(events, function (event) {
        var tracker = trackers.stats[`${event}s`] = {
            total: 0,
            pending: 0,
            failed: 0
        };

        emitter.on(_.camelCase('before-' + event), function (err, o) {
            var item = o.item;
            tracker.pending += 1;

            err && trackers.failures.push({
                source: item ? (item.name || item.id) : '<unknown>',
                at: _.camelCase('before-' + event),
                error: err,
                cursor: o.cursor,
                parent: o.item && item.__parent && item.__parent.__parent
            });
        });

        emitter.on(event, function (err, o) {
            var item = o.item,
                source = event;

            // check pending so that, it does not negate for items that do not have a `before` counterpart
            tracker.pending && (tracker.pending -= 1);
            tracker.total += 1; // increment total

            if (err) { // on error push it to the failure array
                // @todo - perform per-event message detection until, the arguments are unified as an object
                // in case of user script error, point to the line and column of the script and its type
                if (event === 'script') {
                    o.event && (source = o.event.listen + '-script');
                    if (err.stacktrace && err.stacktrace[0] && err.stacktrace[0].lineNumber) {
                        source += (':' + (err.stacktrace[0].lineNumber - 2));
                        err.stacktrace[0].columnNumber && (source += (':' + err.stacktrace[0].columnNumber));
                    }
                }
                else if (event === 'assertion') {
                    _.has(err, 'index') && (source += (':' + (err.index + 1)));
                    source += ' in test-script';
                }

                if (err.stack && !err.stacktrace) {
                    err = new SerialiseError(err, true);
                }

                tracker.failed += 1;

                // we do not append failures for duplacted or propagated events
                if (event === 'testScript' || event === 'prerequestScript') {
                    return;
                }

                trackers.failures.push({
                    cursor: o.cursor,
                    source: item,
                    parent: item && item.__parent && item.__parent.__parent,
                    at: source,
                    error: err
                });
            }
        });
    });

    return trackers;
};

module.exports = RunSummary;
