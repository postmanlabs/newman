var progress = require('cli-progress'),
    ProgressReporter;

/**
 * Littlt reporter that generates a collection progress status bar on CLI
 */
ProgressReporter = function (emitter, reporterOptions, options) {
    if (options.silent || reporterOptions.silent) {
        return;
    }

    var bar = new progress.Bar({});

    emitter.on('start', function (err, o) {
        bar.start(o.cursor.length * o.cursor.cycles, 0);
    });

    emitter.on('item', function () {
        bar.increment();
    });

    emitter.on('done', function () {
        bar.stop();
    });
};

module.exports = ProgressReporter;
