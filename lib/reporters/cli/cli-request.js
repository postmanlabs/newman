var _ = require('lodash'),
    colors = require('colors/safe'),
    Table = require('cli-table3'),
    format = require('util').format,

    util = require('../../util'),
    cliUtils = require('./cli-utils'),
    print = require('../../print'),
    pad = cliUtils.padLeft,

    LF = '\n',
    DOT = '.',
    E = '',

    PostmanCLIRequestReporter,
    timestamp;

const xmlFormat = require('xml-formatter');

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
PostmanCLIRequestReporter = function (emitter, reporterOptions, options) {
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
        const run = this.summary.run;

        if (run.executions[0].response) {
            print('\n');
            const responseHeaders = run.executions[0].response.headers.all();

            responseHeaders.map((element) => {
                print(element.key + ': ' + element.value + LF);
            });

            print('\n');
            if (run.transfers.responseTotal > (options.responseLimit)) {
                print('\n');
                print('Response Size is too large.' +
                LF +
                'Please use the JSON reporter (-r JSON) to download the output in a separate file.');
            }

            else if (run.executions[0].response.contentInfo().mimeFormat === 'xml') {
                print(xmlFormat(run.executions[0].response.text()));
            }

            else if (run.executions[0].response.contentInfo().mimeFormat === 'json') {
                const inputJSON = JSON.parse(run.executions[0].response.text());

                print(JSON.stringify(inputJSON, undefined, 2));
            }

            // show the summary table (provided option does not say it is not to be shown)
            if (!reporterOptions.noSummary) {
                print('\n');
                print(LF + PostmanCLIRequestReporter.parseSingleRequestStatistics(run) + LF);
            }

            if (options.verbose) {
                print('\n');
                print('addresses: ');
                print(PostmanCLIRequestReporter.verboseSession(run).addresses);
                print('\n\n');
                print('tls: ');
                print(PostmanCLIRequestReporter.verboseSession(run).tls);
            }
        }

        // show the failures table (provided option does not say it is not to be shown)
        if (!reporterOptions.noFailures && run.failures && run.failures.length) {
            print(LF + PostmanCLIRequestReporter.parseFailures(run.failures) + LF);
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
    emitter.on('request', function (err) {
        if (err) {
            print.lf(colors.red('[errored]'));
            print.lf(colors.red('     %s'), err.message);
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

_.assignIn(PostmanCLIRequestReporter, {

    verboseSession (run) {
        var verboseSession = run.verboseSession;

        return verboseSession;
    },

    parseSingleRequestStatistics (run) {
        const summaryTable = new Table({
                style: { head: [] },
                colWidths: [40]
            }),
            transfers = run.transfers,
            timingPhases = run.timingPhases;

        // add row to show total data received
        transfers &&
        summaryTable.push([colors.green('Data Received:'), util.filesize(transfers.responseTotal) + ' (approx)']);

        timingPhases && _.forEach({
            dns: 'DNS Lookup Time:',
            tcp: 'TCP Connection Time:',
            secureHandshake: 'Secure Handshake Time:',
            firstByte: 'First Byte Time:',
            download: 'Download Time:',
            total: 'Total Duration:'
        }, (label, key) => {
            timingPhases &&
            summaryTable.push([colors.green(label), util.prettyms(timingPhases[`${key}`])]);
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
PostmanCLIRequestReporter.prototype.dominant = true;

module.exports = PostmanCLIRequestReporter;
