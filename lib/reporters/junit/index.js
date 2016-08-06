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
            var report = _.get(emitter, 'summary.run.executions'),
                collection = _.get(emitter, 'summary.collection'),
                cache,
                root;

            if (!report) {
                return;
            }

            root = xml.create('testsuites', { version: '1.0', encoding: 'UTF-8' });
            root.att('name', collection.name);

            cache = _.transform(report, function (accumulator, execution) {
                accumulator[execution.id] = accumulator[execution.id] || [];
                accumulator[execution.id].push(execution);
            }, {});

            _.forEach(cache, function (executions, itemId) {
                var suite = root.ele('testsuite'),
                    currentItem,
                    tests = {},
                    errorMessages;

                collection.forEachItem(function (item) {
                    (item.id === itemId) && (currentItem = item);
                });

                if (!currentItem) { return; }

                suite.att('name', currentItem.name);
                suite.att('id', currentItem.id);

                _.each(executions, function (execution) {
                    var iteration = execution.cursor.iteration,
                        errored,
                        msg = `Iteration: ${iteration}\n`;

                    // Process errors
                    if (execution.requestError) {
                        errored = true;
                        msg += ('RequestError: ' + (execution.requestError.stack) + '\n');
                    }
                    msg += '\n---\n';
                    _.each(['testScript', 'prerequestScript'], function (prop) {
                        _.each(execution[prop], function (err) {
                            if (err.error) {
                                errored = true;
                                msg = (msg + prop + 'Error: ' + err.error.stack);
                                msg += '\n---\n';
                            }
                        });
                    });

                    if (errored) {
                        errorMessages = _.isString(errorMessages) ? (errorMessages + msg) : msg;
                    }

                    // Process assertions
                    _.forEach(execution.assertions, function (assertion) {
                        var name = assertion.assertion,
                            err = assertion.error;
                        if (err) {
                            (_.isArray(tests[name]) ? tests[name].push(err) : (tests[name] = [err]));
                        }
                        else {
                            tests[name] = [];
                        }
                    });
                });

                suite.att('time', _.mean(_.map(executions, function (execution) {
                    return _.get(execution, 'response.responseTime') || 0;
                })));

                errorMessages && suite.ele('error').dat(errorMessages);

                _.forOwn(tests, function (failures, name) {
                    var testcase = suite.ele('testcase'),
                        failure;
                    testcase.att('name', name);
                    if (failures && failures.length) {
                        failure = testcase.ele('failure');
                        failure.att('type', 'AssertionFailure');
                        failure.dat('Failed ' + failures.length + ' times.');
                    }
                });
            });

            emitter.summary.exports.push({
                path: output,
                content: root.end({
                    pretty: true,
                    indent: '  ',
                    newline: '\n',
                    allowEmpty: false
                })
            });
        });
    };

module.exports = JunitReporter;
