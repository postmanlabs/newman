var fs = require('fs'),
    _ = require('lodash'),
    path = require('path'),
    handlebars = require('handlebars'),

    FILE_READ_OPTIONS = { encoding: 'utf8' },
    DEFAULT_TEMPLATE = 'template-default.hbs',
    ASSERTION_STATE = { false: 'passed', true: 'failed' },

    PostmanHTMLReporter;

PostmanHTMLReporter = function (newman, options) {
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var compiler = handlebars.compile(fs.readFileSync(path.join(__dirname, DEFAULT_TEMPLATE), FILE_READ_OPTIONS));

    newman.on('beforeDone', function () {
        var aggregations = [],
            traversedRequests = {},
            executions = _.get(this, 'summary.run.executions'),
            assertions = _.transform(executions, function (result, currentExecution) {
                if (!_.has(traversedRequests, currentExecution.id)) {
                    // mark the current request instance as traversed
                    _.set(traversedRequests, currentExecution.id, 1);

                    // set sample request and response details for the current request
                    aggregations.push(_.pick(currentExecution, ['item', 'request', 'response']));
                }

                var assertionStatus = _.countBy(currentExecution.assertions, function (assertion) {
                    return ASSERTION_STATE[_.get(assertion, 'error', false)];
                });

                result[currentExecution.id] = result[currentExecution.id] || { passed: 0, failed: 0 };
                result[currentExecution.id].passed += assertionStatus.passed || 0;
                result[currentExecution.id].failed += assertionStatus.failed || 0;
            }, {});

        _.forEach(aggregations, function (currentAggregation) {
            _.set(currentAggregation, 'assertions', assertions[currentAggregation.item.id]);
        });

        // console.log(JSON.stringify(aggregations, null, 2));

        _.set(this.summary.run, 'aggregations', aggregations);
        this.exports.push({
            name: 'html-reporter',
            default: 'newman-run-report.html',
            path: options.export,
            content: compiler(this.summary)
        });
    });
};

module.exports = PostmanHTMLReporter;
