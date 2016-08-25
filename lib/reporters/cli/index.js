var _ = require('lodash'),
    colors = require('colors/safe'),
    Table = require('cli-table2'),
    format = require('util').format,

    cliUtils = require('./cli-utils'),
    print = require('./print'),
    pad = cliUtils.padLeft,

    LF = '\n',
    SPC = ' ',
    E = '',

    /**
     * Helper function to get parent of an item
     *
     * @param {PostmanItem} item
     * @returns {PostmanItemGroup}
     */
    parentOf = function (item) {
        return item && item.__parent && item.__parent.__parent || undefined;
    },

    PostmanCLIReporter;

// sets theme for colors for console logging
colors.setTheme({
    log: 'grey',
    info: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

/**
 * CLI reporter
 *
 * @param {EventEmitter} emitter
 * @param {Object} reporterOptions
 * @param {Boolean} reporterOptions.silent
 * @param {Boolean} reporterOptions.noAssertions
 * @param {Boolean} reporterOptions.noSummary
 * @param {Boolean} reporterOptions.noFailures
 * @param {Boolean} reporterOptions.noConsole
 * @param {Object} options
 */
PostmanCLIReporter = function (emitter, reporterOptions, options) {
    var currentGroup = options.collection,
        inspect = cliUtils.inspector(options.noColor),
        wrap = cliUtils.wrapper();

    // respect silent option to not report anything
    if (reporterOptions.silent || options.silent) {
        return; // we simply do not register anything!
    }

    // we register the `done` listener first so that in case user does not want to show results of collection run, we
    // simply do not register the other events
    emitter.on('done', function () {
        // for some reason, if there is no run summary, it is unexpected and hence don't validate this
        var run = this.summary.run;

        // show the summary table (provided option does not say it is not to be shown)
        if (!reporterOptions.noSummary) {
            print(LF + PostmanCLIReporter.parseStatistics(run.stats, run.timings, run.transfers) + LF);
        }

        // show the failures table (provided option does not say it is not to be shown)
        if (!reporterOptions.noFailures && run.failures && run.failures.length) {
            print(LF + PostmanCLIReporter.parseFailures(run.failures).toString() + LF);
        }
    });

    // in case user does not want to show results of collection run, we simply do not register the other events.
    if (reporterOptions.noAssertions) {
        return;
    }

    emitter.on('start', function () {
        var collectionIdentifier = currentGroup && (currentGroup.name || currentGroup.id);

        // print the newman banner
        print('%s\n\n', colors.reset('newman'));

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

    emitter.on('beforeItem', function (err, o) {
        var itemGroup = parentOf(o.item),
            root = !itemGroup || (itemGroup === options.collection);

        // in case this item belongs to a separate folder, print that folder name
        if (itemGroup && (currentGroup !== itemGroup)) {

            // we only print if the request is not directly under collection. no point printing collection name
            // again and again
            !root && print('\n%s %s', cliUtils.symbols.folder, colors.reset(itemGroup.name));

            // set the flag that keeps track of the currently running group
            currentGroup = itemGroup;
        }

        // we print the item name. the symbol prefix denotes if the item is in root or under folder.
        // @todo - when we do indentation, we would not need symbolic representation
        o.item && print.lf('\n%s %s', (root ?
            cliUtils.symbols.root : cliUtils.symbols.sub), colors.reset(o.item.name || E));
    });

    // print out the request name to be executed and start a spinner
    emitter.on('beforeRequest', function (err, o) {
        o.request && print('  %s %s ', colors.gray(o.request.method), colors.gray(o.request.url)).wait(colors.gray);
    });

    // output the response code, reason and time
    emitter.on('request', function (err, o) {
        var size = o.response && o.response.size();
        size = size && (size.header || 0) + (size.body || 0) || 0;

        err ? print.lf(colors.red('[errored]')) :
            print.lf(colors.gray('[%d %s, %s, %s]'), o.response.code, o.response.reason(),
                cliUtils.filesize(size), cliUtils.prettyms(o.response.responseTime));
    });

    // Print script errors in real time
    emitter.on('script', function (err, o) {
        err && print.lf(colors.red.bold('%s⠄ %s in %s-script'), pad(this.summary.run.failures.length, 3, SPC), err.name,
            o.event && o.event.listen || 'unknown');
    });

    emitter.on('assertion', function (err, o) {
        var passed = !err;

        // print each test assertions
        print.lf('%s %s', passed ? colors.green(`  ${cliUtils.symbols.ok} `) :
            colors.red.bold(pad(this.summary.run.failures.length, 3, SPC) + cliUtils.symbols.dot), passed ?
            colors.gray(o.assertion) : colors.red.bold(o.assertion));
    });

    // show user console logs in a neatly formatted way (provided user has not disabled the same)
    !reporterOptions.noConsole && emitter.on('console', function (err, o) {
        var color = colors[o.level] || colors.gray,
            message;

        // we first merge all messages to a string. while merging we run the values to util.inspect to colour code the
        // messages based on data type
        message = wrap(_.reduce(o.messages, function (log, message) { // wrap the whole message to the window size
            return (log += (log ? colors.white(', ') : '') + inspect(message));
        }, E), `  ${color('│')} `); // add an indentation line at the beginning

        print.buffer(color('  ┌\n'), color('  └\n'))
            // tweak the message to ensure that its surrounding is not brightly coloured.
            // also ensure to remove any blank lines generated due to util.inspect
            .nobuffer(colors.gray(message.replace(/\n\s*\n/g, LF) + LF));
    });
};

_.assignIn(PostmanCLIReporter, {
    parseStatistics: function (stats, timings, transfers) {
        var summaryTable;

        // create the summary table
        summaryTable = new Table({
            style: { head: [] },
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
            content: format('total run duration: %s', cliUtils.prettyms((timings.completed - timings.started) || 0)),
            hAlign: 'left' // since main style was set to right
        }]);

        // add row to show total data received
        transfers && summaryTable.push([{
            colSpan: 3,
            content: format('total data received: %s (approx)', cliUtils.filesize(transfers.responseTotal)),
            hAlign: 'left'
        }]);

        // add row to show average response time
        summaryTable.push([{
            colSpan: 3,
            content: format('average response time: %s', cliUtils.prettyms(timings.responseAverage)),
            hAlign: 'left'
        }]);

        return summaryTable;
    },
    parseFailures: function (failures) {
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
                var colWidths;

                if (size.exists && size.width && (size.width > 20)) {
                    colWidths = [];
                    colWidths[0] = indexOrder + 3;
                    colWidths[1] = parseInt((size.width - colWidths[0]) * 0.2, 10);
                    colWidths[2] = parseInt(size.width - (colWidths[0] + colWidths[1] + 5), 10);
                }

                return colWidths;
            }(cliUtils.dimension(), Number(failures.length.toString().length)))
        });

        _.forEach(failures, function (failure, index) {
            var name = failure.error && failure.error.name || E,
                message = failure.error && failure.error.message || E;

            // augment name with iteration information
            failure.cursor && (failure.cursor.cycles > 1) &&
                (name += LF + colors.gray('iteration: ' + (failure.cursor.iteration + 1)));

            // augment the message with stack information
            failure.at && (message += LF + colors.gray('at ' + failure.at));

            // augment message with item information
            failure.source &&
                (message += format(colors.gray('\ninside "%s"'), (failure.source.name || failure.source.id)));

            // augment message with item parent information
            failure.source && failure.parent &&
                (message += format(colors.gray(' of "%s"'), (failure.parent.name || failure.parent.id)));


            failureTable.push([pad(Number(index + 1), Number(failures.length.toString().length)).toString() +
                cliUtils.symbols.dot, name, message]);
        });

        return failureTable;
    }
});

// Mark the CLI reporter as dominant, so that no two dominant reporters are together
PostmanCLIReporter.prototype.dominant = true;

module.exports = PostmanCLIReporter;
