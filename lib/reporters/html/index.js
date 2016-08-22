var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    handlebars = require('handlebars'),

    FILE_READ_OPTIONS = { encoding: 'utf8' },
    DEFAULT_TEMPLATE = 'template-default.hbs',
    ASSERTION_STATE = { true: 'passed', false: 'failed' },

    PostmanHTMLReporter;

PostmanHTMLReporter = function (newman, options) {
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var compiler = handlebars.compile(fs.readFileSync(path.join(__dirname, DEFAULT_TEMPLATE), FILE_READ_OPTIONS));

    newman.on('beforeDone', function () {
        var aggregations = [],
            executionMeans = {},
            traversedRequests = {},
            executions = _.get(this, 'summary.run.executions'),
            assertions = _.transform(executions, function (result, currentExecution) {
                var executionId = currentExecution.id;

                if (!_.has(traversedRequests, executionId)) {
                    // mark the current request instance as traversed
                    _.set(traversedRequests, executionId, 1);

                    // set base values for overall response size and time values
                    _.set(executionMeans, executionId, { time: { sum: 0, count: 0 }, size: { sum: 0, count: 0 } });

                    // set sample request and response details for the current request
                    aggregations.push(_.pick(currentExecution, ['item', 'request', 'response']));
                }

                result[executionId] = result[executionId] || {}; // set to a blank object if undefined

                executionMeans[executionId].time.sum += _.get(currentExecution, 'response.responseTime');
                executionMeans[executionId].size.sum += _.get(currentExecution, 'response.responseSize');

                ++executionMeans[executionId].time.count;
                ++executionMeans[executionId].size.count;

                _.forEach(currentExecution.assertions, function (assertion) {
                    var aggregationResult,
                        assertionName = assertion.assertion;

                    result[executionId][assertionName] = result[executionId][assertionName] || {
                        name: assertionName,
                        passed: 0,
                        failed: 0
                    };
                    aggregationResult = result[executionId][assertionName];

                    ++aggregationResult[ASSERTION_STATE[_.get(assertion, 'error') === undefined]];
                });
            }, {});

        _.forEach(aggregations, function (currentAggregation) {
            var currentId = currentAggregation.item.id,
                aggregationMean = _.get(executionMeans, currentId),
                meanTime = _.get(aggregationMean, 'time'),
                meanSize = _.get(aggregationMean, 'size');

            _.merge(currentAggregation, {
                mean: {
                    time: (meanTime.sum / (meanTime.count || 1)).toFixed(2),
                    size: (meanSize.sum / (meanSize.count || 1)).toFixed(2)
                }
            });

            _.set(currentAggregation, 'assertions', _.values(_.get(assertions, currentId)));
        });

        _.set(this.summary.run, 'aggregations', aggregations);

        console.log(JSON.stringify(this.summary.run.aggregations, null, 2));
        this.exports.push({
            name: 'html-reporter',
            default: 'newman-run-report.html',
            path: options.output,
            content: compiler(this.summary)
        });
    });
};

module.exports = PostmanHTMLReporter;
