const util = require('../util');

const _ = require('lodash'),
print = require('../print'),
retry = require('async-retry'),
request = require('postman-request'),

POSTMAN_UPLOAD_ERROR_LINK = '<TBA>',
UPLOAD_RUN_API_URL = '<TBA>',
NEWMAN_STRING = 'newman'

/**
 * @private
 * Internal upload call
 *
 * @param {Object} uploadOptions
 * @returns {function} Returns an async function which can be used by async-retry library to have retries
 */
_upload = (uploadOptions) => {
    return async(bail) => await new Promise((resolve, reject) => request.post(uploadOptions , (error, response, body) => {
                if(error){
                    if(error.code === 'ECONNREFUSED') return reject(error) // Retry only if the ERROR is ERRCONNECT
                    return bail(error); // For other errors , dont retry
                }

                // Handle exact status codes

                if(200 <= response.statusCode && response.statusCode <= 299){
                    return resolve(body);
                }

                if( 400 <= response.statusCode && response.statusCode<= 499){

                    if(response.statusCode === 404){
                        return bail(new Error('Couldn\'t find the postman server route'))
                    }

                    return bail(new Error(body.message)); // Avoid retry if there is client side error ( API key error / Workspace ID / permission error)

                }

                if( 500 <= response.statusCode && response.statusCode <= 599){ // Perform Retry if Server side Error
                    return reject(`Retrying server error: ${body.message}`); // Change this after discussion with Harsh
                }

                return reject(`Recieved an unexpected Response status code while uploading Newman run`); // This should not be activated ( Discuss with Harsh , how to handle 3xx )
            })
        );
}

/**
 * @private
 * Internal upload function which handles the retry
 *
 * @param {*} uploadOptions
 * @param {*} retryOptions
 *
 * @returns {Promise}
 */
_uploadWithRetry = (upload, retryOptions) => {
    return retry(upload,{
        retries: retryOptions.maxRetries,
        factor: retryOptions.retryDelayMultiplier,
        randomize: retryOptions.addJitter || false,
        maxRetryTime: retryOptions.maxRetryDelay * 1000 , // converting to ms
        maxTimeout: retryOptions.totalTimeout * 1000, // converting to ms
        onRetry: retryOptions.onRetry || function(){} // e
    });
}

/**
 * @private
 */
 _buildRequestObject = (request)=> {
    return {
    url: request.url, // buildUrl(request.url), // @TODO : Ask utkarsh if we have a function that combines a url object to
    method: request.method,
    path: '/ Collections / Create Collections / Create a collection into personal workspace' // TODO - Find out where is this used
    }
}

/**
 * @private
 * @param {Object} response
 * @param {Boolean} skipResponse
 *
 * @returns {Object}
 */
_buildResponseObject = (response, skipResponse) => {
    if(skipResponse) return

    return {
        code: response.code,
        name: response.status,
        time: response.responseTime,
        size: response.responseSize,
    }
}

/**
 * @private
 * @param {Array} assertions
 *
 * @returns {Array}
 */
_buildTestObject = (assertions) => {
const tests = []

assertions && assertions.forEach(assert => {
    tests.push({
        name: assert.assertion,
        error: assert.error || {}, // @TODO - Understand This is the entire object with params - name , index, test, message , stack
        status: assert.error ? 'fail' : 'pass',
    })
});

return tests
}

/**
 * @private
 * @param {Array} executions
 * @param {Number} iterationCount
 * @param {Boolean} skipResponse
 *
 * @returns {Array}
 */
 _executionToIterationConverter = (executions, iterationCount, skipResponse) => {
    const iterations = []
    executions = util.partition(executions, iterationCount);

    executions.forEach( iter => {
        const iteration = []

        iter.forEach(req => {
            iteration.push({
                id: req.item.id,
                name: req.item.name,
                ref: 'uuid4', // @TODO : Figure out how is this used ??
                request: _buildRequestObject(req.request),
                response: req.response ? _buildResponseObject(req.response, skipResponse): null,
                requestError: req.requestError || '',// @TODO - Check for this with Harsh
                tests: _buildTestObject(req.assertions), // What's the value if tests are not present for a request
            });
        });

        iterations.push(iteration);

    });
    return iterations
}

/**
 * @private
 * @param {Object} runOptions
 * @param {Object} runOptions
 *
 * @returns {String}
 */
 _buildPostmanUploadPayload = (runOptions, runSummary) => {
    const run = {
        name: runOptions.collection.name || '',
        status:runSummary.run.error ? 'failed': 'finished', // THis can be finished or failed - Check with Harsh about all the possible values
        source: NEWMAN_STRING,
        failedTestCount: runSummary.run.stats.assertions.failed || 0,
        totalTestCount: runSummary.run.stats.assertions.total || 0,
        collection: runOptions.collectionUID || '',
        environment: runOptions.environmentUID || '',
        iterations: _executionToIterationConverter(runSummary.run.executions, runOptions.iterationCount , runOptions.publishSkipResponse),
        delay: runOptions.delayRequest,
        persist: false,
        saveResponse: !runOptions.publishSkipResponse,
        dataFile: runOptions.collectionUID && runOptions.environmentUID ? runOptions.iterationData : null,
        workspace: runOptions.publish,
        currentIteration: runOptions.iterationCount,// Tells how many iterations where there ,
        folder: '' // @TODO - What is this ?
    }
    return JSON.stringify(run);
}

/**
 * @public
 * Starts the run upload process
 *
 * @param {*} runSummary
 * @param {*} runOptions
 *
 * @returns { Promise }
 */
 uploadRunToPostman = (runSummary, runOptions) => {

    let runPayload;

    runOptions.collectionUID = util.extractResourceUID(runOptions.collection);
    runOptions.environmentUID = util.extractResourceUID(runOptions.environment);

     try{
         runPayload = _buildPostmanUploadPayload(runOptions, runSummary)
        }catch(error){
        throw new Error(`Unable to serialize the run - ${error}`);
    }

    print.lf('Uploading newman run to Postman');

    const uploadOptions = {
        url: UPLOAD_RUN_API_URL,
        body: runPayload,
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': runOptions.postmanApiKey
        }
    },
    retryOptions = {
        maxRetries: runOptions.publishRetries,
        totalTimeout: runOptions.publishTimeout,
        retryDelayMultiplier: 2,
        maxRetryDelay : 64,
        addJitter: true
    };

    return _uploadWithRetry(_upload(uploadOptions), retryOptions);
}

module.exports = {
    uploadRunToPostman,
    POSTMAN_UPLOAD_ERROR_LINK,

    // Exporting following functions for testing ONLY.
    _executionToIterationConverter,
    _buildPostmanUploadPayload,
    _buildRequestObject,
    _buildResponseObject,
    _buildTestObject,
    _uploadWithRetry,
    _upload,

};
