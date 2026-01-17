const _ = require('lodash'),
    uuid = require('uuid'),
    {
        NEWMAN_STRING,
        FALLBACK_COLLECTION_RUN_NAME,
        NEWMAN_RUN_STATUS_FINISHED,
        NEWMAN_TEST_STATUS_PASS,
        NEWMAN_TEST_STATUS_FAIL,
        NEWMAN_TEST_STATUS_SKIPPED
    } = require('./constants');

/**
 * Returns a request object that contains url, method, headers and body data
 *
 * Example request object: {
 *  url: 'https://postman-echo.com/get?user=abc&pass=123,
 *  method: 'get',
 *  headers: {
 *    'Authorization': 'Basic as1ews',
 *    'Accept': 'application/json'
 *  },
 *  body: {
 *    mode: 'raw',
 *    raw: 'this is a raw body'
 *  }
 * }
 *
 * @private
 * @param {Object} request - a postman-collection SDK's request object
 * @returns {Object}
 */
function _buildRequestObject (request) {
    if (!request) {
        return {};
    }

    return {
        url: _.invoke(request, 'url.toString', ''),
        method: _.get(request, 'method', ''),
        headers: request.getHeaders({ enabled: false }), // only get the headers that were actually sent in the request
        body: _.get(_.invoke(request, 'toJSON'), 'body')
    };
}

/**
 * Returns a response object that contains response name, code, time, size, headers and body
 *
 * Example Response object: {
 *  code: 200
 *  name: 'OK'
 *  time: 213
 *  size: 43534
 *  headers: [{key: 'content-type', value: 'application/json'}, {key: 'Connection', value: 'keep-alive'}].
 *  body: 'who's thereee!'
 * }
 *
 * @private
 * @param {Object} response - a postman-collection SDK's response object
 * @returns {Object}
 */
function _buildResponseObject (response) {
    if (!response) {
        return {};
    }

    const headersArray = _.get(response, 'headers.members', []),
        headers = _.map(headersArray, (header) => {
            return _.pick(header, ['key', 'value']);
        });

    return {
        code: response.code,
        name: response.status,
        time: response.responseTime,
        size: response.responseSize,
        headers: headers,
        body: response.text()
    };
}

/**
 * Returns an array of assertions, with each assertion containing name, error and status (pass/fail)
 * Example assertions array: [
 *  {
 *    name: 'Status code should be 200',
 *    error: null,
 *    status: 'pass'
 *  },
 *  {
 *    name: 'Status code should be 404',
 *    error: 'AssertionError: expected response to have status code 404 but got 200',
 *    status: 'fail'
 *  }
 * ]
 *
 * @private
 * @param {Array} assertions - A list of all the assertions performed during the newman run
 * @returns {Array}
 */
function _buildTestObject (assertions) {
    const tests = [];

    assertions && assertions.forEach((assert) => {
        let status;

        if (assert.skipped) {
            status = NEWMAN_TEST_STATUS_SKIPPED;
        }
        else if (assert.error) {
            status = NEWMAN_TEST_STATUS_FAIL;
        }
        else {
            status = NEWMAN_TEST_STATUS_PASS;
        }

        tests.push({
            name: assert.assertion,
            error: assert.error ? _.pick(assert.error, ['name', 'message', 'stack']) : null,
            status: status
        });
    });

    return tests;
}

/**
 * Calculates the number of skipped tests for the run
 *
 * @private
 * @param {Object} runSummary - newman run summary data
 * @returns {Number}
 */
function _extractSkippedTestCountFromRun (runSummary) {
    let skippedTestCount = 0;

    _.forEach(_.get(runSummary, 'run.executions', []), (execution) => {
        _.forEach(_.get(execution, 'assertions', []), (assertion) => {
            if (_.get(assertion, 'skipped')) {
                skippedTestCount++;
            }
        });
    });

    return skippedTestCount;
}

/**
 * Converts a newman execution array to an iterations array.
 * An execution is a flat array, which contains the requests run in order over multiple iterations.
 * This function converts this flat array into an array of arrays with a single element representing a single iteration.
 * Hence each iteration is an array, which contains all the requests that were run in that particular iteration
 * A request object contains request data, response data, the test assertion results, etc.
 *
 * Example element of a execution array
 * {
 *  cursor: {} // details about the pagination
 *  item: {} // current request meta data
 *  request: {} // the request data like url, method, headers, etc.
 *  response: {} // the response data received for this request
 *  assertions: [] // an array of all the test results
 * }
 *
 * @private
 * @param {Array} executions - An array of newman run executions data
 * @param {Number} iterationCount - The number of iterations newman ran for
 * @returns {Array}
 */
function _executionToIterationConverter (executions, iterationCount) {
    const iterations = [],
        validIterationCount = _.isSafeInteger(iterationCount) && iterationCount > 0;

    if (!validIterationCount) {
        executions = [executions]; //  Assuming only one iteration of the newman run was performed
    }
    else {
    // Note: The second parameter of _.chunk is the size of each chunk and not the number of chunks.
    // The number of chunks is equal to the number of iterations, hence the below calculation.
        executions = _.chunk(executions, (executions.length / iterationCount)); // Group the requests iterations wise
    }

    _.forEach(executions, (iter) => {
        const iteration = [];

        // eslint-disable-next-line lodash/prefer-map
        _.forEach(iter, (req) => {
            iteration.push({
                id: req.item.id,
                name: req.item.name || '',
                request: _buildRequestObject(req.request),
                response: _buildResponseObject(req.response),
                error: req.requestError || null,
                tests: _buildTestObject(req.assertions)
            });
        });

        iterations.push(iteration);
    });

    return iterations;
}

/**
 * Converts a newman run summary object to a collection run object.
 *
 * @param {Object} collectionRunOptions - newman run options
 * @param {Object} runSummary - newman run summary data
 * @returns {Object}
 */
function buildCollectionRunObject (collectionRunOptions, runSummary) {
    if (!collectionRunOptions || !runSummary) {
        throw new Error('Cannot build Collection run object without collectionRunOptions or runSummary');
    }

    let failedTestCount = _.get(runSummary, 'run.stats.assertions.failed', 0),
        skippedTestCount = _extractSkippedTestCountFromRun(runSummary),
        totalTestCount = _.get(runSummary, 'run.stats.assertions.total', 0),
        executions = _.get(runSummary, 'run.executions'),
        iterationCount = _.get(runSummary, 'run.stats.iterations.total', 1), // default no of iterations is 1
        totalRequests = _.get(runSummary, 'run.stats.requests.total', 0),
        collectionRunObj = {
            id: uuid.v4(),
            collection: _.get(collectionRunOptions, 'collection.id'),
            environment: _.get(collectionRunOptions, 'environment.id'),
            folder: _.get(collectionRunOptions, 'folder.id'),
            name: _.get(collectionRunOptions, 'collection.name', FALLBACK_COLLECTION_RUN_NAME),
            status: NEWMAN_RUN_STATUS_FINISHED,
            source: NEWMAN_STRING,
            delay: collectionRunOptions.delayRequest || 0,
            currentIteration: iterationCount,
            failedTestCount: failedTestCount,
            skippedTestCount: skippedTestCount,
            passedTestCount: (totalTestCount - (failedTestCount + skippedTestCount)),
            totalTestCount: totalTestCount,
            iterations: _executionToIterationConverter(executions, iterationCount),
            // total time of all responses
            totalTime: _.get(runSummary, 'run.timings.responseAverage', 0) * totalRequests,
            totalRequests: totalRequests,
            startedAt: _.get(runSummary, 'run.timings.started'),
            createdAt: _.get(runSummary, 'run.timings.completed') // time when run was completed and ingested into DB
        };

    collectionRunObj = _.omitBy(collectionRunObj, _.isNil);

    return collectionRunObj;
}

module.exports = {
    buildCollectionRunObject
};
