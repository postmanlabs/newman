var progress = require('cli-progress'),
    ProgressReporter;

/**
 * Little reporter that generates a collection progress status bar on CLI
 */
ProgressReporter = function (newman, reporterOptions, options) {
    if (options.silent || reporterOptions.silent) {
        return;
    }

    var bar = new progress.Bar({});

    newman.on('start', function (err, o) {
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
