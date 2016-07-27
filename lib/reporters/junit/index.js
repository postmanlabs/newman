var _ = require('lodash'),
    xml = require('xmlbuilder'),
    fs = require('fs'),

    /**
     * Formats a date object.
     *
     * @param {Date=} date
     * @returns {string}
     */
    formatDate = function formatDate(date) {
        !date && (date = new Date());
        var year = date.getFullYear(),
            month = date.getMonth() + 1, // months are zero indexed
            day = date.getDate(),
            hour = date.getHours(),
            minute = date.getMinutes(),
            second = date.getSeconds();
        return `${month}-${day}-${year}.${hour}-${minute}-${second}`;
    },

    JunitReporter = function (emitter, reporterOptions) {
        var output = reporterOptions.output || 'newman-report-' + formatDate() + '.xml';

        emitter.on('done', function () {
            var report = _.get(emitter, 'summary.collection'),
                root;

            if (!report) {
                return;
            }

            root = xml.create('testsuites', { version: '1.0', encoding: 'UTF-8' });
            root.att('name', report.name);

            report.forEachItem(function (item) {
                var suite = root.ele('testsuite'),
                    tests = {};

                // todo: add timestamp of when the request was made
                suite.att('name', item.name);
                suite.att('id', item.id);
                suite.att('time', _.mean(_.map(item.responses.all(), 'responseTime' )));

                if (item.error) {
                    suite.ele('error').dat(item.error.stack || item.error.message);
                    return;
                }

                _.each(item.results, function (iterationResults, iteration) {
                    _.forOwn(iterationResults, function (passed, name) {
                        var testCase = tests[name] = tests[name] || suite.ele('testcase');
                        testCase.att('name', name);
                        !passed && (testCase.ele('failure').dat('Failed in iteration: ' + iteration));
                    });
                });
            });

            fs.writeFileSync(output, root.end({
                pretty: true,
                indent: '  ',
                newline: '\n',
                allowEmpty: false
            }));
        });
    };

module.exports = JunitReporter;
