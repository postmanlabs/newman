var SmileyReporter;

/**
 * 😀
 */
SmileyReporter = function (emitter, reporterOptions, options) {
    if (options.silent || reporterOptions.silent) {
        return;
    }

    var fails = {},
        noteFailure;

    noteFailure = function (err, args) {
        err && (fails[args.cursor.ref] = true);
    };

    emitter.on('script', noteFailure);
    emitter.on('request', noteFailure);
    emitter.on('assertion', noteFailure);

    emitter.on('item', function (err, args) {
        process.stdout.write((err || fails[args.cursor.ref]) ? '😢 ' : '😀 ');
    });

    emitter.on('done', function (err) {
        console.log((err || Object.keys(fails).length) ? ' 😭' : ' 😍');
    });

};

SmileyReporter.prototype.dominant = true;
module.exports = SmileyReporter;
