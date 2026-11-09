const _ = require('lodash'),
    print = require('../../../print'),
    request = require('postman-request'),
    {
        POSTMAN_API_BASE_URL,
        POSTMAN_API_UPLOAD_PATH,
        RESPONSE_FALLBACK_ERROR_MESSAGE
    } = require('./constants'),
    { buildCollectionRunObject } = require('./run-utils');

/**
 * 1. Converts the newman run summary into a collection run object.
 * 2. Makes an API call to postman API to upload the collection run data to postman.
 *
 * @param {String} postmanApiKey - Postman API Key used for authentication
 * @param {Object} collectionRunOptions - newman run options.
 * @param {String} collectionRunOptions.verbose -
 *  If set, it shows detailed information of collection run and each request sent.
 * @param {Object} runSummary - newman run summary data.
 * @param {Function} callback - The callback function whose invocation marks the end of the uploadRun routine.
 * @returns {Promise}
 */
function uploadRun (postmanApiKey, collectionRunOptions, runSummary, callback) {
    let collectionRunObj, runOverviewObj, requestConfig;

    if (!runSummary) {
        return callback(new Error('runSummary is a required parameter to upload run data'));
    }

    try {
        // convert the newman run summary data to collection run object
        collectionRunObj = buildCollectionRunObject(collectionRunOptions, runSummary);
    }
    catch (error) {
        return callback(new Error('Failed to serialize the run for upload. Please try again.'));
    }

    requestConfig = {
        url: POSTMAN_API_BASE_URL + POSTMAN_API_UPLOAD_PATH,
        body: JSON.stringify({
            collectionRun: collectionRunObj,
            runOverview: runOverviewObj
        }),
        headers: {
            'content-type': 'application/json',
            accept: 'application/vnd.postman.v2+json',
            'x-api-key': postmanApiKey
        }
    };

    return request.post(requestConfig, (error, response, body) => {
        if (error) {
            return callback(new Error(_.get(error, 'message', RESPONSE_FALLBACK_ERROR_MESSAGE)));
        }

        // logging the response body in case verbose option is enabled
        if (collectionRunOptions.verbose) {
            print.lf('Response received from postman run publish API');
            print.lf(body);
        }

        // case 1: upload successful
        if (_.inRange(response.statusCode, 200, 300)) {
            return callback(null, JSON.parse(body));
        }

        // case 2: upload unsuccessful due to some client side error e.g. api key invalid
        if (_.inRange(response.statusCode, 400, 500)) {
            return callback(new Error(_.get(JSON.parse(body),
                'processorErrorBody.message', RESPONSE_FALLBACK_ERROR_MESSAGE)));
        }

        // case 3: Unexpected response received from server (5xx)
        return callback(new Error(RESPONSE_FALLBACK_ERROR_MESSAGE));
    });
}

module.exports = {
    uploadRun
};
