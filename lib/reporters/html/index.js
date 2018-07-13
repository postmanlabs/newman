var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    handlebars = require('handlebars'),

    util = require('../../util'),

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

    /**
     * The list of execution data fields that are aggregated over multiple requests for the collection run
     *
     * @type {String[]}
     */
    AGGREGATED_FIELDS = ['item', 'request', 'response', 'requestError'],

    IS_NODE_V4 = _(process && process.version).split('.').get(0) === 'v4',

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
    handlebars.registerHelper('add', function (addend, augend) {
        return addend + augend;
    });
    handlebars.registerHelper('gt', function (value, threshold, options) {
        return value > threshold ? options.fn(this) : options.inverse(this);
    });

    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var htmlTemplate = options.template || path.join(__dirname, DEFAULT_TEMPLATE),
        compiler = handlebars.compile(fs.readFileSync(htmlTemplate, FILE_READ_OPTIONS));

    newman.on('beforeDone', function () {
        var items = {},
            executionMeans = {},
            netTestCounts = {},
            aggregations = [],
            traversedRequests = {},
            aggregatedExecutions = {},
            executions = _.get(this, 'summary.run.executions'),
            assertions = _.transform(executions, function (result, currentExecution) {
                var stream,
                    reducedExecution,
                    executionId = currentExecution.id;

                if (!_.has(traversedRequests, executionId)) {
                    // mark the current request instance as traversed
                    _.set(traversedRequests, executionId, 1);

                    // set the base assertion and cumulative test details for the current request instance
                    _.set(result, executionId, {});
                    _.set(netTestCounts, executionId, { passed: 0, failed: 0 });

                    // set base values for overall response size and time values
                    _.set(executionMeans, executionId, { time: { sum: 0, count: 0 }, size: { sum: 0, count: 0 } });

                    reducedExecution = _.pick(currentExecution, AGGREGATED_FIELDS);

                    if (reducedExecution.response && _.isFunction(reducedExecution.response.toJSON)) {
                        reducedExecution.response = reducedExecution.response.toJSON();
                        stream = reducedExecution.response.stream;

                        // Use deprecated Buffer constructor for Node v4, contemporary one for other versions
                        // @todo remove when dropping support for node < v6, to save some memory.
                        // eslint-disable-next-line no-buffer-constructor
                        reducedExecution.response.body = (IS_NODE_V4 ? new Buffer(stream && stream.data) :
                            Buffer.from(stream)).toString();
                    }

                    // set sample request and response details for the current request
                    items[reducedExecution.item.id] = reducedExecution;
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
            }, {}),

            aggregator = function (execution) {
                // fetch aggregated run times and response sizes for items, (0 for failed requests)
                var aggregationMean = executionMeans[execution.item.id],
                    meanTime = _.get(aggregationMean, 'time', 0),
                    meanSize = _.get(aggregationMean, 'size', 0),
                    parent = execution.item.parent(),
                    previous = _.last(aggregations),
                    current = _.merge(items[execution.item.id], {
                        assertions: _.values(assertions[execution.item.id]),
                        mean: {
                            time: util.prettyms(meanTime.sum / meanTime.count),
                            size: util.filesize(meanSize.sum / meanSize.count)
                        },
                        cumulativeTests: netTestCounts[execution.item.id]
                    });

                if (aggregatedExecutions[execution.id]) { return; }

                aggregatedExecutions[execution.id] = true;

                if (previous && parent.id === previous.parent.id) {
                    previous.executions.push(current);
                }
                else {
                    aggregations.push({
                        parent: {
                            id: parent.id,
                            name: util.getFullName(parent)
                        },
                        executions: [current]
                    });
                }
            };

        _.forEach(this.summary.run.executions, aggregator);

        this.exports.push({
            name: 'html-reporter',
            default: 'newman-run-report.html',
            path: options.export,
            content: compiler({
                timestamp: Date(),
                version: util.version,
                aggregations: aggregations,
                summary: {
                    stats: this.summary.run.stats,
                    collection: this.summary.collection,
                    globals: _.isObject(this.summary.globals) ? this.summary.globals : undefined,
                    environment: _.isObject(this.summary.environment) ? this.summary.environment : undefined,
                    failures: this.summary.run.failures,
                    responseTotal: util.filesize(this.summary.run.transfers.responseTotal),
                    responseAverage: util.prettyms(this.summary.run.timings.responseAverage),
                    duration: util.prettyms(this.summary.run.timings.completed - this.summary.run.timings.started)
                }
            })
        });
    });
};

module.exports = PostmanHTMLReporter;
