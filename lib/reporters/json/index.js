var _ = require('lodash');

/**
 * Reporter that simply dumps the summary object to file (default: newman-run-report.json).
 *
 * @param {Object} newman - The collection run object, with event hooks for reporting run details.
 * @param {Object} options - A set of collection run options.
 * @param {String} options.export - The path to which the summary object must be written.
 * @returns {*}
 */
module.exports = function (newman, options) {
    newman.on('beforeDone', function (err, o) {
        if (err) { return; }

        newman.exports.push({
            name: 'json-reporter',
            default: 'newman-run-report.json',
            path: options.export,
            content: JSON.stringify(_.omit(o.summary, 'exports'), 0, 2)
        });
    });
};
