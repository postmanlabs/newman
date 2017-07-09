var progress = require('cli-progress'),
    ProgressReporter;

/**
 * Little reporter that generates a collection progress status bar on CLI.
 *
 * @param {Object} newman - A run object with event handler specification methods.
 * @param {Function} newman.on - An event setter method that provides hooks for reporting collection run progress.
 * @param {Object} reporterOptions - A set of reporter specific run options.
 * @param {Object} options - A set of generic collection run options.
 * @returns {*}
 */
ProgressReporter = function (newman, reporterOptions, options) {
    if (options.silent || reporterOptions.silent) {
        return;
    }

    var bar = new progress.Bar({});

    newman.on('start', function (err, o) {
        if (err) { return; }

        bar.start(o.cursor.length * o.cursor.cycles, 0);
    });

    newman.on('item', function () {
        bar.increment();
    });

    newman.on('done', function () {
        bar.stop();
    });
};

ProgressReporter.prototype.dominant = true;
module.exports = ProgressReporter;
