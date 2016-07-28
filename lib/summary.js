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
    var summary = this,
        trackers;

    // execute `trackEvent` function to attach listeners and update the pass, fail and pending count of each event
    trackers = RunSummary.trackEvent(['iteration', 'item', 'script', 'prerequest', 'request', 'test', 'assertion',
        'testScript', 'prerequestScript'], emitter);

    // and store the trackers and failures in the summary object itself
    _.assign(summary, {
        timings: {
            responseAverage: 0
        },
        stats: trackers.stats,
        failures: trackers.failures,
        transfers: {
            responseTotal: 0
        },
        // store little bits of information regarding the run within the `info` object
        info: {
            collectionId: _.get(options, 'collection.id'),
            collectionName: _.get(options, 'collection.name')
        }
    });

    // mark the point when the run started
    // also mark the point when run completed and also store error if needed
    emitter.on('start', function () { summary.timings.started = Date.now(); });
    emitter.on('done', function (err) {
        summary.timings.completed = Date.now();
        err && (summary.error = err);
    });

    // accumulate statistics on requests
    emitter.on('request', function (err, o) {
        if (err && !(o && o.response)) { return; }

        var size = o.response.size(),
            time = o.response.responseTime,

            requestCount = summary.stats.requests.total;

        // compute the response size total
        size && (summary.transfers.responseTotal += (size.body || 0 + size.headers || 0));

        // compute average response time
        time && (summary.timings.responseAverage =
            ((summary.timings.responseAverage * (requestCount - 1) + time) / requestCount));
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
