var _ = require('lodash'),
    prettyms = require('pretty-ms'),
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
    };

module.exports = function PostmanCLIReporter (emitter, options) {
    var currentGroup = options.collection;

    emitter.on('start', function () {
        // print the collection name and newman infoline
        print.lf('%s\n\n%s', colors.reset('newman'), colors.reset(currentGroup.name));
    });

    emitter.on('beforeIteration', function (err, o) {
        if (err || o.cursor.cycles <= 1) {
            return; // do not print iteration banner if it is a single iteration run
        }

        // print the iteration infoline
        print.lf(LF + colors.gray.underline('Iteration %d/%d') + LF, o.cursor.iteration + 1, o.cursor.cycles);
    });

    emitter.on('beforeItem', function (err, o) {
        var itemGroup = parentOf(o.item),
            root = !itemGroup || (itemGroup === options.collection);

        // in case this item belongs to a separate folder, print that folder name
        if (itemGroup && (currentGroup !== itemGroup)) {

            // we only print if the request is not directly under collection. no point printing collection name
            // again and again
            !root && print.lf('\n❏ %s', colors.reset(itemGroup.name));

            // set the flag that keeps track of the currently running group
            currentGroup = itemGroup;
        }

        // we print the item name. the symbol prefix denotes if the item is in root or under folder.
        // @todo - when we do indentation, we would not need symbolic representation
        o.item && print.lf('%s %s', (root ? '→' : '↳'), colors.reset(o.item.name || E));
    });

    // print out the request name to be executed and start a spinner
    emitter.on('beforeRequest', function (err, o) {
        o.request && print('  %s %s ', colors.gray(o.request.method), colors.gray(o.request.url)).wait();
    });

    // output the response code, reason and time
    emitter.on('request', function (err, o) {
        err ? print.lf(colors.red('[errored]')) :
            print.lf(colors.gray('[%d %s, %s]'), o.response.code, o.response.reason(),
                prettyms(o.response.responseTime));
    });

    // realtime print out script errors
    emitter.on('script', function (err, o) {
        err && print.lf(colors.red.bold('%s⠄ %s in %s-script'), pad(this.summary.failures.length, 3, SPC), err.name,
            o.event && o.event.listen || 'unknown');
    });

    emitter.on('assertion', function (err, o) {
        var passed = !err;

        // print each test assertions
        print.lf('%s %s', passed ? colors.green('  ✔ ') : colors.red.bold(pad(this.summary.failures.length, 3, SPC) +
            '⠄'), passed ? colors.gray(o.assertion) : colors.red.bold(o.assertion));
    });

    emitter.on('done', function () {
        var summary = this.summary,
            failures = summary.failures,
            failureFaceValue = Number(failures.length.toString().length),
            failureTable,
            summaryTable;

        // create the summary table
        summaryTable = new Table({
            style: { head: [] },
            head: [E, 'executed', '  failed', ' pending'],
            colAligns: ['right', 'right', 'right', 'right'],
            colWidths: [20]
        });

        // add specific rows to show in summary
        _.each([{
            source: 'iterations',
            label: 'iterations'
        }, {
            source: 'requests',
            label: 'requests'
        }, {
            source: 'assertions',
            label: 'tests'
        }], function (row) {
            var metric = summary[row.source],
                label = row.label;

            // colour the label based on the failure or pending count of the metric
            label = metric.failed ? colors.red(label) : (metric.pending ? label : colors.green(label));

            // push the statistics
            summaryTable.push([
                label,
                metric.total,
                metric.failed ? colors.red(metric.failed) : metric.failed,
                metric.pending
            ]);
        });

        // add the total execution time to summary
        summaryTable.push([{
            colSpan: 4,
            content: format('total run duration: %s', prettyms((summary.completed - summary.started) || 0)),
            hAlign: 'left' // since main style was set to right
        }]);

        // @todo - add options to not print summary
        print('\n' + summaryTable.toString() + '\n');

        if (!failures.length) {
            return;
        }

        failureTable = new Table({
            head: [{
                hAlign: 'right',
                content: colors.red.underline('#')
            }, colors.red.underline('failure'),
                colors.red.underline('detail')],
            chars: cliUtils.cliTableTemplate_Blank,
            wordWrap: true,
            colAligns: ['right'],
            colWidths: (function (size, indexOrder) {
                var colWidths;

                if (size.width && (size.width > 20)) {
                    colWidths = [];
                    colWidths[0] = indexOrder + 3;
                    colWidths[1] = parseInt((size.width - colWidths[0]) * 0.2, 10);
                    colWidths[2] = parseInt(size.width - (colWidths[0] + colWidths[1] + 5), 10);
                }

                return colWidths;
            }(require('window-size'), Number(failures.length.toString().length)))
        });

        _.each(failures, function (failure, index) {
            var name = failure.error && failure.error.name || E,
                message = failure.error && failure.error.message || E;

            // augment the message with stack information
            failure.at && (message += '\n' + colors.gray('at ' + failure.at));
            failure.source && (message += '\n' + colors.gray('inside ' + (failure.source.name || failure.source.id)));
            failure.parent &&
                (message += ('\n' + colors.gray('  inside ' + (failure.parent.name || failure.parent.id))));

            failureTable.push([pad(Number(index + 1), failureFaceValue).toString() + '⠄', name, message]);
        });

        print('\n' + failureTable.toString() + '\n');
    });
};
