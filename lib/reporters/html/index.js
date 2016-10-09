var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    fileSize = require('filesize'),
    prettyMs = require('pretty-ms'),
    handlebars = require('handlebars'),

    /**
     * An object of the default file read preferences.
     *
     * @type {Object}
     */
    FILE_READ_OPTIONS = { encoding: 'utf8' },

    /**
     * The default Handlebars template to use when no user specified template is provided.
     *
     * @type {String}
     */
    DEFAULT_TEMPLATE = 'template-default.hbs',

    /**
     * A reference object for run stats properties to use for various assertion states.
     *
     * @type {Object}
     */
    ASSERTION_STATE = { false: 'passed', true: 'failed' },

    PostmanHTMLReporter;

/**
 * A function that creates raw markup to be written to Newman HTML reports.
 *
 * @param {Object} newman - The collection run object, with a event handler setter, used to enable event wise reporting.
 * @param {Object} options - The set of HTML reporter run options.
 * @param {String=} options.template - Optional path to the custom user defined HTML report template (Handlebars).
 * @param {String=} options.export - Optional custom path to create the HTML report at.
 * @returns {*}
 */
PostmanHTMLReporter = function (newman, options) {
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var htmlTemplate = options.template || path.join(__dirname, DEFAULT_TEMPLATE),
        compiler = handlebars.compile(fs.readFileSync(htmlTemplate, FILE_READ_OPTIONS));

    newman.on('beforeDone', function () {
        var aggregations = [],
            executionMeans = {},
            netTestCounts = {},
            traversedRequests = {},
            executions = _.get(this, 'summary.run.executions'),
            assertions = _.transform(executions, function (result, currentExecution) {
                var executionId = currentExecution.id;

                if (!_.has(traversedRequests, executionId)) {
                    // mark the current request instance as traversed
                    _.set(traversedRequests, executionId, 1);

                    // set the base assertion and cumulative test details for the current request instance
                    _.set(result, executionId, {});
                    _.set(netTestCounts, executionId, { passed: 0, failed: 0 });

                    // set base values for overall response size and time values
                    _.set(executionMeans, executionId, { time: { sum: 0, count: 0 }, size: { sum: 0, count: 0 } });

                    // set sample request and response details for the current request
                    aggregations.push(_.pick(currentExecution, ['item', 'request', 'response']));
                }

                executionMeans[executionId].time.sum += _.get(currentExecution, 'response.responseTime', 0);
                executionMeans[executionId].size.sum += _.get(currentExecution, 'response.responseSize', 0);

                ++executionMeans[executionId].time.count;
                ++executionMeans[executionId].size.count;

                _.forEach(currentExecution.assertions, function (assertion) {
                    var aggregationResult,
                        assertionName = assertion.assertion,
                        isError = _.get(assertion, 'error') !== undefined,
                        updateKey = _.get(ASSERTION_STATE, isError);

                    result[executionId][assertionName] = result[executionId][assertionName] || {
                        name: assertionName,
                        passed: 0,
                        failed: 0
                    };
                    aggregationResult = result[executionId][assertionName];

                    ++aggregationResult[updateKey];
                    ++netTestCounts[executionId][updateKey];
                });
            }, {});

        _.forEach(aggregations, function (currentAggregation) {
            var currentId = currentAggregation.item.id,
                aggregationMean = _.get(executionMeans, currentId),
                meanTime = _.get(aggregationMean, 'time'),
                meanSize = _.get(aggregationMean, 'size');

            _.merge(currentAggregation, {
                mean: {
                    time: prettyMs(meanTime.sum / (meanTime.count || 1)),
                    size: fileSize(meanSize.sum / (meanSize.count || 1), { spacer: '' })
                },
                cumulativeTests: _.get(netTestCounts, currentId)
            });

            _.set(currentAggregation, 'assertions', _.values(_.get(assertions, currentId)));
        });

        this.exports.push({
            name: 'html-reporter',
            default: 'newman-run-report.html',
            path: options.export,
            content: compiler({
                timestamp: Date(),
                aggregations: aggregations,
                summary: {
                    stats: this.summary.run.stats,
                    collection: this.summary.collection,
                    failures: this.summary.run.failures.length
                }
            })
        });
    });
};

module.exports = PostmanHTMLReporter;
