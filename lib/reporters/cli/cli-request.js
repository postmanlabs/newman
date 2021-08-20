var _ = require('lodash'),
    colors = require('colors/safe'),
    Table = require('cli-table3'),

    util = require('../../util'),
    cliUtils = require('./cli-utils'),
    print = require('../../print'),

    LF = '\n',

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
    var currentGroup = options.collection;

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
            dns: 'DNS Lookup Time',
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
    }
});

// Mark the CLI reporter as dominant, so that no two dominant reporters are together
PostmanCLIRequestReporter.prototype.dominant = true;

module.exports = PostmanCLIRequestReporter;
