var _ = require('lodash'),
    sdk = require('postman-collection'),
    colors = require('colors/safe'),
    Table = require('cli-table3'),
    format = require('util').format,

    util = require('../../util'),
    cliUtils = require('./cli-utils'),
    print = require('../../print'),
    pad = cliUtils.padLeft,

    LF = '\n',
    SPC = ' ',
    DOT = '.',
    E = '',

    CACHED_TIMING_PHASE = '(cache)',
    TIMING_TABLE_HEADERS = {
        prepare: 'prepare',
        wait: 'wait',
        dns: 'dns-lookup',
        tcp: 'tcp-handshake',
        secureHandshake: 'ssl-handshake',
        firstByte: 'transfer-start',
        download: 'download',
        process: 'process',
        total: 'total'
    },
    BODY_CLIP_SIZE = 2048,

    PostmanCLIReporter,
    timestamp,
    extractSNR;

// sets theme for colors for console logging
colors.setTheme({
    log: 'grey',
    info: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

extractSNR = function (executions) {
    var snr;

    // eslint-disable-next-line lodash/collection-method-value
    _.isArray(executions) && _.forEachRight(executions, function (execution) {
        var nextReq = _.get(execution, 'result.return.nextRequest');

        if (nextReq) {
            snr = nextReq;

            return false;
        }
    });

    return snr;
};

/**
 * CLI reporter
 *
 * @param {EventEmitter} emitter - An EventEmitter instance with event handler attachers to trigger reporting.
 * @param {Object} reporterOptions - CLI reporter options object.
 * @param {Boolean=} reporterOptions.silent - Boolean flag to turn off CLI reporting altogether, if set to true.
 * @param {Boolean=} reporterOptions.noAssertions - Boolean flag to turn off assertion reporting, if set to true.
 * @param {Boolean=} reporterOptions.noSuccessAssertions - Boolean flag, if true, turn off report successful assertions.
 * @param {Boolean=} reporterOptions.noSummary - Boolean flag to turn off summary reporting altogether, if set to true.
 * @param {Boolean=} reporterOptions.noFailures - Boolean flag to turn off failure reporting altogether, if set to true.
 * @param {Boolean=} reporterOptions.noConsole - Boolean flag to turn off console logging, if set to true.
 * @param {Boolean=} reporterOptions.noBanner - Boolean flag to turn off newman banner, if set to true.
 * @param {Object} options - A set of generic collection run options.
 * @returns {*}
 */
PostmanCLIReporter = function (emitter, reporterOptions, options) {
    var currentGroup = options.collection,
        inspect = cliUtils.inspector(options),
        wrap = cliUtils.wrapper(),
        symbols = cliUtils.symbols(options.disableUnicode);

    // respect silent option to not report anything
    if (reporterOptions.silent || options.silent) {
        return; // we simply do not register anything!
    }

    // disable colors based on `noTTY`.
    cliUtils.noTTY(options.color) && colors.disable();

    // we register the `done` listener first so that in case user does not want to show results of collection run, we
    // simply do not register the other events
    emitter.on('done', function () {
        // for some reason, if there is no run summary, it is unexpected and hence don't validate this
        var run = this.summary.run;

        // show the summary table (provided option does not say it is not to be shown)
        if (!reporterOptions.noSummary) {
            print(LF + PostmanCLIReporter.parseStatistics(run.stats, run.timings, run.transfers, options) + LF);
        }

        // show the failures table (provided option does not say it is not to be shown)
        if (!reporterOptions.noFailures && run.failures && run.failures.length) {
            print(LF + PostmanCLIReporter.parseFailures(run.failures) + LF);
        }
    });

    emitter.on('start', function () {
        var collectionIdentifier = currentGroup && (currentGroup.name || currentGroup.id);

        if (!reporterOptions.noBanner) {
            // print the newman banner
            print('%s\n\n', colors.reset('newman'));
        }

        // print the collection name and newman info line
        collectionIdentifier && print.lf('%s', colors.reset(collectionIdentifier));
    });

    emitter.on('beforeIteration', function (err, o) {
        if (err || o.cursor.cycles <= 1) {
            return; // do not print iteration banner if it is a single iteration run
        }

        // print the iteration info line
        print.lf(LF + colors.gray.underline('Iteration %d/%d'), o.cursor.iteration + 1, o.cursor.cycles);
    });

    emitter.on('test', function (err, o) {
        if (err) {
            return;
        }
        var snr = extractSNR(o.executions);

        if (snr) {
            print.lf(LF + colors.gray('Attempting to set next request to', snr));
        }
    });

    emitter.on('beforeItem', function (err, o) {
        if (err) { return; }

        var itemGroup = o.item.parent(),
            root = !itemGroup || (itemGroup === options.collection);

        // in case this item belongs to a separate folder, print that folder name
        if (itemGroup && (currentGroup !== itemGroup)) {
            !root && print('\n%s %s', symbols.folder, colors.reset(util.getFullName(itemGroup)));

            // set the flag that keeps track of the currently running group
            currentGroup = itemGroup;
        }

        // we print the item name. the symbol prefix denotes if the item is in root or under folder.
        // @todo - when we do indentation, we would not need symbolic representation
        o.item && print.lf('\n%s %s', (root ?
            symbols.root : symbols.sub), colors.reset(o.item.name || E));
    });

    // print out the request name to be executed and start a spinner
    emitter.on('beforeRequest', function (err, o) {
        if (err || !o.request) { return; }

        if (reporterOptions.showTimestamps) {
            var currentTime = new Date();

            timestamp = '[' + currentTime.toLocaleString() + ']';
            print('  %s  %s %s ',
                colors.gray(timestamp),
                colors.gray(o.request.method),
                colors.gray(o.request.url.toString()));
        }
        else {
            print('  %s %s ',
                colors.gray(o.request.method),
                colors.gray(o.request.url.toString()));
        }

        !options.disableUnicode && print().wait(colors.gray);
    });

    // output the response code, reason and time
    emitter.on('request', function (err, o) {
        if (err) {
            print.lf(colors.red('[errored]'));
            print.lf(colors.red('     %s'), err.message);

            return;
        }

        if (!(o.request && o.response)) {
            print.lf(colors.red('[errored]'));
            print.lf(colors.red('     %s'), 'Internal error! Could not read response data.');

            return;
        }

        // quickly print out basic non verbose response meta and exit
        if (!options.verbose) {
            print.lf(colors.gray('[%d %s, %s, %s]'), o.response.code, o.response.reason(),
                util.filesize(o.response.size().total), util.prettyms(o.response.responseTime));

            return;
        }

        // this point onwards the output is verbose. a tonne of variables are created here for
        // keeping the output clean and readable

        let req = o.request,
            res = o.response,

            // set values here with abundance of caution to avoid erroring out
            reqSize = util.filesize(req.size().total),
            resSize = util.filesize(res.size().total),
            code = res.code,
            reason = res.reason(),
            mime = res.contentInfo() || {},
            timings = _.last(_.get(o, 'history.execution.data')),

            reqHeadersLen = _.get(req, 'headers.members.length'),
            resHeadersLen = _.get(res, 'headers.members.length'),

            resTime = util.prettyms(res.responseTime || 0),

            reqText = (options.verbose && req.body) ? req.body.toString() : E,
            reqTextLen = req.size().body || Buffer.byteLength(reqText),

            resText = options.verbose ? res.text() : E,
            resTextLen = res.size().body || Buffer.byteLength(resText),

            reqBodyMode = _.get(req, 'body.mode', ''),
            resSummary = [
                `${mime.contentType}`,
                `${mime.mimeType}`,
                `${mime.mimeFormat}`,
                `${mime.charset}`
            ].join(` ${colors.gray(symbols.star)} `);


        print.lf(SPC); // also flushes out the circling progress icon

        // for clean readability of code. this section compiles the cli string for one line of
        // req-res combined summary. this looks somewhat like below:
        // >> 200 OK ★ 979ms time ★ 270B↑ 793B↓ size ★ 7↑ 7↓ headers ★ 0 cookies
        print.lf(SPC + SPC + [
            `${code} ${reason}`,
            `${resTime} ${colors.gray('time')}`,
            `${reqSize}${colors.gray(symbols.up)} ${resSize}${colors.gray(symbols.down)} ${colors.gray('size')}`,
            `${reqHeadersLen}${colors.gray(symbols.up)} ` +
                `${resHeadersLen}${colors.gray(symbols.down)} ${colors.gray('headers')}`,
            `${_.get(res, 'cookies.members.length')} ${colors.gray('cookies')}`
        ].join(` ${colors.gray(symbols.star)} `));

        // print request body
        if (reqTextLen) {
            // truncate very large request (is 2048 large enough?)
            if (reqTextLen > BODY_CLIP_SIZE) {
                reqText = reqText.substr(0, BODY_CLIP_SIZE) +
                    colors.brightWhite(`\n(showing ${util.filesize(BODY_CLIP_SIZE)}/${util.filesize(reqTextLen)})`);
            }

            reqText = wrap(reqText, `  ${colors.white(symbols.console.middle)} `);
            // eslint-disable-next-line max-len
            print.buffer(`  ${colors.white(symbols.console.top)} ${colors.white(symbols.up)} ${reqBodyMode} ${colors.gray(symbols.star)} ${util.filesize(reqTextLen)}\n`,
                colors.white(`  ${symbols.console.bottom}`))
                // tweak the message to ensure that its surrounding is not brightly coloured.
                // also ensure to remove any blank lines generated due to util.inspect
                .nobuffer(colors.gray(reqText.replace(/\n\s*\n/g, LF) + LF));

            print.lf(SPC); // visual tweak: flushes out the buffer of wrapping body above
        }

        // print response body
        if (resTextLen) {
            // truncate very large response (is 2048 large enough?)
            if (resTextLen > BODY_CLIP_SIZE) {
                resText = resText.substr(0, BODY_CLIP_SIZE) +
                    colors.brightWhite(`\n(showing ${util.filesize(BODY_CLIP_SIZE)}/${util.filesize(resTextLen)})`);
            }

            resText = wrap(resText, `  ${colors.white(symbols.console.middle)} `);
            // eslint-disable-next-line max-len
            print.buffer(`  ${colors.white(symbols.console.top)} ${colors.white(symbols.down)} ${resSummary} ${colors.gray(symbols.star)} ${util.filesize(resTextLen)}\n`,
                colors.white(`  ${symbols.console.bottom}`))
                // tweak the message to ensure that its surrounding is not brightly coloured.
                // also ensure to remove any blank lines generated due to util.inspect
                .nobuffer(colors.gray(resText.replace(/\n\s*\n/g, LF) + LF));
        }
        // print the line of response body meta one liner if there is no response body
        // if there is one, we would already print it across the body braces above.
        else {
            // we need to do some newline related shenanigans here so that the output looks clean
            // in the absence of the request body block
            print.lf(`  ${symbols.down} ${resSummary}`);
        }

        // print timing info of the request
        timings = timings && timings.timings; // if there are redirects, get timings for the last request sent
        if (timings) {
            // adds nice units to all time data in the object
            let timingPhases = util.beautifyTime(sdk.Response.timingPhases(timings)),
                timingTable = new Table({
                    chars: _.defaults({ mid: '', middle: '' }, cliUtils.cliTableTemplate_Blank),
                    colAligns: _.fill(Array(_.size(timingPhases)), 'left'),
                    style: { 'padding-left': 2 }
                });

            timingPhases = _.transform(TIMING_TABLE_HEADERS, (result, header, key) => {
                if (_.has(timingPhases, key)) {
                    result.headers.push(colors.white(header));
                    result.values.push(colors.log(timingPhases[key] || CACHED_TIMING_PHASE));
                }
            }, { headers: [], values: [] });


            timingTable.push(timingPhases.headers); // add name of phases in the table
            timingTable.push(timingPhases.values); // add time of phases in the table

            print(LF + timingTable + LF + LF);
        }
    });

    // Print script errors in real time
    emitter.on('script', function (err, o) {
        err && print.lf(colors.red.bold('%s⠄ %s in %s-script'), pad(this.summary.run.failures.length, 3, SPC), err.name,
            o.event && o.event.listen || 'unknown');
    });

    !reporterOptions.noAssertions && emitter.on('assertion', function (err, o) {
        var passed = !err;

        // handle skipped test display
        if (o.skipped && !reporterOptions.noSuccessAssertions) {
            print.lf('%s %s', colors.cyan('  - '), colors.cyan('[skipped] ' + o.assertion));

            return;
        }

        if (passed && reporterOptions.noSuccessAssertions) {
            return;
        }

        // print each test assertions
        if (reporterOptions.showTimestamps) {
            timestamp = '[' + new Date().toLocaleTimeString() + ']';
            print.lf('  %s%s %s', colors.gray(timestamp), passed ? colors.green(`  ${symbols.ok} `) :
                colors.red.bold(pad(this.summary.run.failures.length, 2, SPC) + symbols.dot), passed ?
                colors.gray(o.assertion) : colors.red.bold(o.assertion));
        }
        else {
            print.lf('%s %s', passed ? colors.green(`  ${symbols.ok} `) :
                colors.red.bold(pad(this.summary.run.failures.length, 3, SPC) + symbols.dot), passed ?
                colors.gray(o.assertion) : colors.red.bold(o.assertion));
        }
    });

    // show user console logs in a neatly formatted way (provided user has not disabled the same)
    !reporterOptions.noConsole && emitter.on('console', function (err, o) {
        if (err) { return; }

        var color = colors[o.level] || colors.gray,
            message;

        // we first merge all messages to a string. while merging we run the values to util.inspect to colour code the
        // messages based on data type
        message = wrap(_.reduce(o.messages, function (log, message) { // wrap the whole message to the window size
            return (log += (log ? colors.white(', ') : '') + inspect(message));
        }, E), `  ${color(symbols.console.middle)} `); // add an indentation line at the beginning

        // print the timestamp if the falg is present
        if (reporterOptions.showTimestamps) {
            print(LF + '  %s', colors.gray('[' + new Date().toLocaleTimeString() + ']' + LF));
        }

        print.buffer(color(`  ${symbols.console.top}\n`), color(`  ${symbols.console.bottom}\n`))
            // tweak the message to ensure that its surrounding is not brightly coloured.
            // also ensure to remove any blank lines generated due to util.inspect
            .nobuffer(colors.gray(message.replace(/\n\s*\n/g, LF) + LF));
    });
};

_.assignIn(PostmanCLIReporter, {

    // @todo: change function signature to accept run object and options, thereby reducing parameters
    /**
     * A CLI reporter method to parse collection run statistics into a CLI table.
     *
     * @param {Object} stats - The cumulative collection run status object.
     * @param {Object} stats.iterations - A set of values for total, pending, and failed iterations.
     * @param {Number} stats.iterations.total - Total iterations in the current collection run.
     * @param {Number} stats.iterations.pending - Pending iterations in the current collection run.
     * @param {Number} stats.iterations.failed - Failed iterations in the current collection run.
     * @param {Object} stats.requests - A set of values for total, pending, and failed requests.
     * @param {Number} stats.requests.total - Total requests in the current collection run.
     * @param {Number} stats.requests.pending - Pending requests in the current collection run.
     * @param {Number} stats.requests.failed - Failed requests in the current collection run.
     * @param {Object} stats.testScripts - A set of values for total, pending, and failed testScripts.
     * @param {Number} stats.testScripts.total - Total testScripts in the current collection run.
     * @param {Number} stats.testScripts.pending - Pending testScripts in the current collection run.
     * @param {Number} stats.testScripts.failed - Failed testScripts in the current collection run.
     * @param {Object} stats.prerequestScripts - A set of values for total, pending, and failed prerequestScripts.
     * @param {Number} stats.prerequestScripts.total - Total prerequestScripts in the current collection run.
     * @param {Number} stats.prerequestScripts.pending - Pending prerequestScripts in the current collection run.
     * @param {Number} stats.prerequestScripts.failed - Failed prerequestScripts in the current collection run.
     * @param {Object} stats.assertions - A set of values for total, pending, and failed assertions.
     * @param {Number} stats.assertions.total - Total assertions in the current collection run.
     * @param {Number} stats.assertions.pending - Pending assertions in the current collection run.
     * @param {Number} stats.assertions.failed - Failed assertions in the current collection run.
     * @param {Object} timings - A set of values for the timings of the current collection run.
     * @param {Number} timings.completed - The end timestamp for the current collection run.
     * @param {Number} timings.started - The start timestamp for the current collection run
     * @param {String} timings.responseAverage - The average response time across all requests
     * @param {String} timings.responseMin - The minimum response time across all requests
     * @param {String} timings.responseMax - The maximum response time across all requests
     * @param {String} timings.responseSd - Standard deviation of response time across all requests
     * @param {String} timings.dnsAverage - The average DNS lookup time of the run
     * @param {String} timings.dnsMin - The minimum DNS lookup time of the run
     * @param {String} timings.dnsMax - The maximum DNS lookup time of the run
     * @param {String} timings.dnsSd - Standard deviation of DNS lookup time of the run
     * @param {String} timings.firstByteAverage - The average first byte time of the run
     * @param {String} timings.firstByteMin - The minimum first byte time of the run
     * @param {String} timings.firstByteMax - The maximum first byte time of the run
     * @param {String} timings.firstByteSd - Standard deviation of first byte time of the run
     * @param {Object} transfers - A set of details on the network usage for the current collection run.
     * @param {String} transfers.responseTotal - The net extent of the data transfer achieved during the collection run.
     * @param {Object} options - The set of generic collection run options.
     * @returns {Table} - The constructed collection run statistics table.
     */
    parseStatistics (stats, timings, transfers, options) {
        var summaryTable,
            style = { head: [] };

        if (cliUtils.noTTY(options.color)) {
            style.border = [];
        }

        // create the summary table
        summaryTable = new Table({
            chars: options.disableUnicode && cliUtils.cliTableTemplateFallback,
            style: style,
            head: [E, 'executed', '  failed'],
            colAligns: ['right', 'right', 'right'],
            colWidths: [25]
        });

        // add specific rows to show in summary
        stats && _.forEach([{
            source: 'iterations',
            label: 'iterations'
        }, {
            source: 'requests',
            label: 'requests'
        }, {
            source: 'testScripts',
            label: 'test-scripts'
        }, {
            source: 'prerequestScripts',
            label: 'prerequest-scripts'
        }, {
            source: 'assertions',
            label: 'assertions'
        }], function (row) {
            var metric = stats[row.source],
                label = row.label;

            // colour the label based on the failure or pending count of the metric
            label = metric.failed ? colors.red(label) : (metric.pending ? label : colors.green(label));

            // push the statistics
            summaryTable.push([
                label,
                metric.total,
                (metric.failed ? colors.red(metric.failed) : metric.failed)
                // @todo - add information of pending scripts
                // (metric.failed ? colors.red(metric.failed) : metric.failed) +
                //     (metric.pending ? format(' (%d pending)', metric.pending) : E)
            ]);
        });

        // add the total execution time to summary
        timings && summaryTable.push([{
            colSpan: 3,
            content: format('total run duration: %s', util.prettyms(timings.completed - timings.started)),
            hAlign: 'left' // since main style was set to right
        }]);

        // add row to show total data received
        transfers && summaryTable.push([{
            colSpan: 3,
            content: format('total data received: %s (approx)', util.filesize(transfers.responseTotal)),
            hAlign: 'left'
        }]);

        // add rows containing average time of different request phases
        timings && _.forEach({
            response: 'average response time:',
            dns: 'average DNS lookup time:',
            firstByte: 'average first byte time:'
        }, (value, key) => {
            timings[`${key}Average`] && summaryTable.push([{
                colSpan: 3,
                content: format(`${value} %s [min: %s, max: %s, s.d.: %s]`,
                    util.prettyms(timings[`${key}Average`]),
                    util.prettyms(timings[`${key}Min`]),
                    util.prettyms(timings[`${key}Max`]),
                    util.prettyms(timings[`${key}Sd`])),
                hAlign: 'left'
            }]);
        });

        return summaryTable;
    },

    /**
     * A CLI reporter method to parse collection run failure statistics into a CLI table.
     *
     * @param  {Array} failures - An array of failure objects.
     * @returns {Table} - The constructed CLI failure Table object.
     */
    parseFailures (failures) {
        var failureTable = new Table({
            head: [{
                hAlign: 'right',
                content: colors.red.underline('#')
            }, colors.red.underline('failure'),
            colors.red.underline('detail')],
            chars: cliUtils.cliTableTemplate_Blank,
            wordWrap: true,
            colAligns: ['right'],
            colWidths: cliUtils.noTTY() ? [] : (function (size, indexOrder) {
                var colWidths = [];

                if (size.exists && size.width && (size.width > 20)) {
                    colWidths[0] = indexOrder + 3;
                    colWidths[1] = parseInt((size.width - colWidths[0]) * 0.2, 10);
                    colWidths[2] = parseInt(size.width - (colWidths[0] + colWidths[1] + 5), 10);
                }

                return colWidths;
            }(cliUtils.dimension(), Number(failures.length.toString().length)))
        });

        _.forEach(failures, function (failure, index) {
            var name = failure.error && failure.error.name || E,
                message = failure.error && failure.error.test || E;

            // augment name with iteration information
            failure.cursor && (failure.cursor.cycles > 1) &&
                (name += LF + colors.gray('iteration: ' + (failure.cursor.iteration + 1)));

            // include the assertion error message in the failure details
            failure.error && (message += LF + colors.gray(failure.error.message || E));

            // augment the message with stack information
            failure.at && (message += LF + colors.gray('at ' + failure.at));

            // augment message with item information
            failure.source &&
                (message += format(colors.gray('\ninside "%s"'), util.getFullName(failure.source)));

            failureTable.push([pad(Number(index + 1), Number(failures.length.toString().length)).toString() +
                DOT, name, message]);
        });

        return failureTable;
    }
});

// Mark the CLI reporter as dominant, so that no two dominant reporters are together
PostmanCLIReporter.prototype.dominant = true;

module.exports = PostmanCLIReporter;
