var _ = require('lodash'),
    xml = require('xmlbuilder'),

    JunitReporter;

JunitReporter = function (newman, reporterOptions) {
    newman.on('beforeDone', function () {
        var report = _.get(newman, 'summary.run.executions'),
            collection = _.get(newman, 'summary.collection'),
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

            _.forEach(executions, function (execution) {
                var iteration = execution.cursor.iteration,
                    errored,
                    msg = `Iteration: ${iteration}\n`;

                // Process errors
                if (execution.requestError) {
                    errored = true;
                    msg += ('RequestError: ' + (execution.requestError.stack) + '\n');
                }
                msg += '\n---\n';
                _.forEach(['testScript', 'prerequestScript'], function (prop) {
                    _.forEach(execution[prop], function (err) {
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

        newman.exports.push({
            name: 'junit-reporter',
            default: 'newman-run-report.xml',
            path: reporterOptions.export,
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
