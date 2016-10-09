var SmileyReporter;

/**
 * Fills your collection run (read life) with a bunch of Emojis 😀.
 *
 * @param {Object} newman - The collection run object with event handling hooks to enable reporting.
 * @param {Object} reporterOptions - A set of reporter specific run options.
 * @param {Object} options - A set of generic collection run options.
 * @returns {*}
 */
SmileyReporter = function (newman, reporterOptions, options) {
    if (options.silent || reporterOptions.silent) {
        return;
    }

    var fails = {},
        noteFailure;

    noteFailure = function (err, args) {
        err && (fails[args.cursor.ref] = true);
    };

    newman.on('script', noteFailure);
    newman.on('request', noteFailure);
    newman.on('assertion', noteFailure);

    newman.on('item', function (err, args) {
        process.stdout.write((err || fails[args.cursor.ref]) ? '😢 ' : '😀 ');
    });

    newman.on('done', function (err) {
        console.info((err || Object.keys(fails).length) ? ' 😭' : ' 😍');
    });
};

SmileyReporter.prototype.dominant = true;
module.exports = SmileyReporter;
