var _ = require('lodash'),
    xml = require('xmlbuilder'),

    util = require('../../util'),
    JunitReporter,

    /**
     * Normalizes the name of a test suite to a valid class name.
     *
     * @private
     * @param {String} name - The name of the test suite.
     * @returns {String} - The class name for the test suite.
     */
    getClassName = (name) => {
        return _.upperFirst(_.camelCase(name).replace(/\W/g, ''));
    };

/**
 * A function that creates raw XML to be written to Newman JUnit reports.
 *
 * @param {Object} newman - The collection run object, with a event handler setter, used to enable event wise reporting.
 * @param {Object} reporterOptions - A set of JUnit reporter run options.
 * @param {String=} reporterOptions.export - Optional custom path to create the XML report at.
 * @returns {*}
 */
JunitReporter = function (newman, reporterOptions) {
   /**
   * Convert the response entries to JSON format.
   * @param {Array} errors 
   * @returns {Array} 
   */
    function xml(errors) {
        return errors.map(error => JSON.stringify(error));
    }
    newman.on('beforeDone', function () {
        var report = _.get(newman, 'summary.run.executions'),
            collection = _.get(newman, 'summary.collection'),
            cache,
            root,
            testSuitesExecutionTime = 0,
            executionTime = 0,
            timestamp,
            classname;

        if (!report) {
            return;
        }

        classname = getClassName(collection.name);

        root = xml.create('testsuites', { version: '1.0', encoding: 'UTF-8' });
        root.att('name', collection.name);
        root.att('tests', _.get(newman, 'summary.run.stats.tests.total', 'unknown'));

        cache = _.transform(report, function (accumulator, execution) {
            accumulator[execution.item.id] = accumulator[execution.id] || [];
            accumulator[execution.item.id].push(execution);
        }, {});

        timestamp = new Date(_.get(newman, 'summary.run.timings.started')).toISOString();

        _.forEach(cache, function (executions, itemId) {
            var suite = root.ele('testsuite'),
                currentItem,
                tests = {},
                errors = 0,
                failures = 0,
                errorMessages;

            collection.forEachItem(function (item) {
                (item.id === itemId) && (currentItem = item);
            });

            if (!currentItem) { return; }

            suite.att('name', util.getFullName(currentItem));
            suite.att('id', currentItem.id);

            suite.att('timestamp', timestamp);

            _.forEach(executions, function (execution) {
                var iteration = execution.cursor.iteration,
                    errored,
                    msg = `Iteration: ${iteration}\n`;

                // Process errors
                if (execution.requestError) {
                    ++errors;
                    errored = true;
                    msg += ('RequestError: ' + (execution.requestError.stack) + '\n');
                }
                msg += '\n---\n';
                _.forEach(['testScript', 'prerequestScript'], function (prop) {
                    _.forEach(execution[prop], function (err) {
                        if (err.error) {
                            ++errors;
                            errored = true;
                            msg = (msg + prop + 'Error: ' + (err.error.stack || err.error.message));
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
                        ++failures;
                        (_.isArray(tests[name]) ? tests[name].push(err) : (tests[name] = [err]));
                    }
                    else {
                        tests[name] = [];
                    }
                });
                if (execution.assertions) {
                    suite.att('tests', execution.assertions.length);
                }
                else {
                    suite.att('tests', 0);
                }

                suite.att('failures', failures);
                suite.att('errors', errors);
            });

            suite.att('time', _.mean(_.map(executions, function (execution) {
                executionTime = _.get(execution, 'response.responseTime') / 1000 || 0;
                testSuitesExecutionTime += executionTime;

                return executionTime;
            })).toFixed(3));
            errorMessages && suite.ele('system-err').dat(errorMessages);

            _.forOwn(tests, function (failures, name) {
                var testcase = suite.ele('testcase'),
                    failure;

                testcase.att('name', name);
                testcase.att('time', executionTime.toFixed(3));

                // Set the same classname for all the tests
                testcase.att('classname',
                    getClassName(_.get(testcase.up(), 'attribs.name.value')) || classname);

                if (failures && failures.length) {
                    failure = testcase.ele('failure');
                    failure.att('type', 'AssertionFailure');
                    failure.dat('Failed ' + failures.length + ' times.');
                    failure.dat('Collection JSON ID: ' + collection.id + '.');
                    failure.dat('Collection name: ' + collection.name + '.');
                    failure.dat('Request name: ' + util.getFullName(currentItem) + '.');
                    failure.dat('Test description: ' + name + '.');
                    if (failures.length !== 0) {
                        failure.att('message', failures[0].message);
                        failure.dat('Error message: ' + failures[0].message + '.');
                        failure.dat('Stacktrace: ' + failures[0].stack + '.');
                    }
                }
            });
        });

        root.att('time', testSuitesExecutionTime.toFixed(3));
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
