var colors = require('colors/safe'),
    format = require('util').format,
    Table = require('cli-table2'),

    print,
    padLeft;

padLeft = function (nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || '0') + nr;
};

print = function () {
    return print.print.apply(this, arguments);
};

print.print = function () {
    print.unwait();
    process.stdout.write(format.apply(this, arguments).replace(/\n/g, '\n' + print._indentPrefix));
    return print;
};

print._waitFrames = ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'];
print._waitMaxFrames = print._waitFrames.length - 1;
print._waitPosition = 0;

print.wait = function (color) {
    print.unwait();

    process.stdout.write(' ');
    print.waiting = setInterval(function () {
        process.stdout.write('\b' + (color ? color(print._waitFrames[print._waitPosition++]) :
            print._waitFrames[print._waitPosition++]));
        (print._waitPosition > print._waitMaxFrames) && (print._waitPosition = 0);
    }, 100);
    return print;
};

print.unwait = function () {
    if (!print.waiting) { return print; }
    print.waiting = clearInterval(print.waiting);
    print._waitPosition = 0;
    process.stdout.write('\b');
    return print;
};

print._indentPrefix = '';
// print.indent = function (count) {
//     // @todo -comlete
// };
// print.unindent = function (count) {
//     // @todo -comlete
// };

module.exports = function PostmanCLIReporter (emitter, options) {
    var currentGroup = options.collection;

    emitter.on('start', function () {
        print('%s\n\n%s\n', colors.reset('newman'), colors.bold(currentGroup.name));
    });

    emitter.on('beforeIteration', function (err, cur) {
        var tempprix = print._indentPrefix;
        print._indentPrefix = '';
        (cur.cycles > 1) &&
            print('\n' + colors.gray.underline('Iteration %d/%d') + '\n\n', cur.iteration + 1, cur.cycles);
        print._indentPrefix = tempprix;
    });

    emitter.on('beforeItem', function (err, cursor, item) {
        if (currentGroup !== item.__parent.__parent) {
            // reset indentation before folder
            // @todo this assumes no nested folder
            print._indentPrefix = '';

            (item.__parent.__parent !== options.collection) &&
                print('\n▢ %s', colors.bold(item.__parent.__parent.name));
            currentGroup = item.__parent.__parent;

            print._indentPrefix = ((currentGroup === options.collection) ? '' : ' ');
            print('\n');
        }

        print('↳ %s\n', colors.reset(item.name));
    });

    emitter.on('beforeRequest', function (err, cur, request) {
        print('  %s %s ', colors.gray(request.method), colors.gray(request.url)).wait();
    });

    emitter.on('request', function (err, cur, response) {
        // @todo - trap request errors
        print(colors.gray('[%d, %dms]') + '\n', response.code, response.responseTime);
    });

    emitter.on('script', function (err, cur, execution, script, event) {
        err && print(colors.red.bold('%s⠄ %s in %s script\n'), padLeft(this.summary.failures.length, 3, ' '), err.name,
            event && event.listen || '<unknown-script>');
    });

    emitter.on('assertion', function (err, cur, assertion) {
        var passed = !err;

        print('%s %s\n', passed ? colors.green('  ✔ ') : colors.red.bold(padLeft(this.summary.failures.length, 3, ' ') +
            '⠄'), passed ? colors.gray(assertion) : colors.red.bold(assertion));
    });

    emitter.on('done', function () {
        var summary = this.summary,
            failures = summary.failures,
            failureFaceValue = Number(failures.length.toString().length),
            size = require('window-size'),
            colWidths = [],
            failureTable,
            name,
            message,
            failure,
            i,
            ii;



        if (!failures.length) {
            return;
        }

        if (size.width && (size.width > 20)) {
            colWidths[0] = failureFaceValue + 2;
            colWidths[1] = parseInt((size.width - colWidths[0]) * 0.2, 10);
            colWidths[2] = parseInt(size.width - (colWidths[0] + colWidths[1] + 4), 10);
        }
        else {
            colWidths = undefined;
        }

        failureTable = new Table({
            head: [{
                hAlign: 'right',
                content: colors.red('#')
            }, colors.red.underline('Failure'),
                colors.red.underline('Details')],
            chars: { 'mid': ' ', 'left-mid': '│', 'mid-mid': '│', 'right-mid': '│' },
            wordWrap: true,
            colWidths: colWidths
        });

        for (i = 0, ii = failures.length; i < ii; i++) {
            failure = failures[i];

            message = failure.error && failure.error.message || '';
            failure.at && (message += '\n' + colors.gray('at ' + failure.at));
            failure.source && (message += '\n' + colors.gray('inside ' + (failure.source.name || failure.source.id)));
            failure.parent &&
                (message += ('\n' + colors.gray('  inside ' + (failure.parent.name || failure.parent.id))));

            name = failure.error && failure.error.name || '';

            failureTable.push([{
                hAlign: 'right',
                content: padLeft(Number(i + 1), failureFaceValue).toString()
            }, name, message]);
        }

        print._indentPrefix = '';
        print('\n' + failureTable.toString() + '\n');
    });
};
