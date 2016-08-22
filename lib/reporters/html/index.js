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
            traversedRequests = {},
            executions = _.get(this, 'summary.run.executions'),
            assertions = _.transform(executions, function (result, currentExecution) {
                var executionId = currentExecution.id;

                if (!_.has(traversedRequests, executionId)) {
                    // mark the current request instance as traversed
                    _.set(traversedRequests, executionId, 1);

                    // set sample request and response details for the current request
                    aggregations.push(_.pick(currentExecution, ['item', 'request', 'response']));
                }

                result[executionId] = result[executionId] || {}; // set to a blank object if undefined

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
            _.set(currentAggregation, 'assertions', _.values(_.get(assertions, currentAggregation.item.id)));
        });

        _.set(this.summary.run, 'aggregations', aggregations);

        this.exports.push({
            name: 'html-reporter',
            default: 'newman-run-report.html',
            path: options.output,
            content: compiler(this.summary)
        });
    });
};

module.exports = PostmanHTMLReporter;
