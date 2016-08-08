var _ = require('lodash');

/**
 * Reporter that simply dumps the summary object to file
 *
 */
module.exports = function (newman, options) {
    newman.on('beforeDone', function (err, o) {
        newman.exports.push({
            name: 'json-reporter',
            default: 'newman-run-report.json',
            path: options.export,
            content: JSON.stringify(_.omit(o.summary, 'exports'), 0, 2)
        });
    });
};
