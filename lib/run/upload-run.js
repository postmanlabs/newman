const _ = require('lodash'),
    sdk = require('postman-collection'),
    util = require('../util'),
    print = require('../print'),
    retry = require('async-retry'),
    request = require('postman-request'),
    uuid4 = require('uuid4'),
    POSTMAN_UPLOAD_ERROR_LINK = '<TBA>',
    UPLOAD_RUN_API_URL = 'https://history.postman-beta.tech',
    NEWMAN_STRING = 'newman';

/**
 * @private
 * Internal upload call
 *
 * @param {Object} uploadOptions
 * @returns {function} Returns an async function which can be used by async-retry library to have retries
 */
_upload = (uploadOptions) => {
    return async (bail) => await new Promise((resolve, reject) => { request.post(uploadOptions , (error, response, body) => {
                if(error){
                    if(error.code === 'ECONNREFUSED') { // Retry only if the ERROR is ERRCONNECT
                        return reject(new Error(error.message));
                    }
                    return bail(error); // For other errors , dont retry
                }

                // Handle exact status codes

                if(200 <= response.statusCode && response.statusCode <= 299){
                    return resolve(JSON.parse(body));
                }

                if( 400 <= response.statusCode && response.statusCode<= 499 ){

                    if(response.statusCode === 404){
                        return bail(new Error('Couldn\'t find the postman server route'))
                    }

                    return bail(new Error(body.message)); // Avoid retry if there is client side error ( API key error / Workspace ID / permission error)

                }

                if( 500 <= response.statusCode && response.statusCode <= 599){ // Perform Retry if Server side Error
                    return reject(new Error(`Failed to upload due to server side error`)); // Change this after discussion with Harsh
                }

                return reject(new Error(`Recieved an unexpected Response status code while uploading Newman run`)); // This should not be activated ( Discuss with Harsh , how to handle 3xx )
            })});
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
        onRetry: retryOptions.onRetry || function(err){console.log('Retry Reason', err)}
    });
}

/**
 * @private
 */
 _buildRequestObject = (request)=> {

    if (!request) {
      return {};
    }

    request = new sdk.Request(request);

    return {
      url: _.invoke(request, 'url.toString', ''),
      method: _.get(request, 'method', ''),
      headers: request.getHeaders({ enabled: false }),
      body: request.toJSON().body,
      path: ''// '/ Collections / Create Collections / Create a collection into personal workspace' // TODO - Find out where is this used , ask giri if we can skip this ?
    };

}

/**
 * @private
 * @param {Object} response
 * @param {Boolean} skipResponse
 *
 * @returns {Object}
 */
_buildResponseObject = (response, skipResponse) => {

    if(!response) {
        return {}
    }

    return {
        code: response.code,
        name: response.status,
        time: response.responseTime,
        size: response.responseSize,
        headers: response.header,
        body: (!skipResponse && response.stream.data ) ? new TextDecoder('utf-8').decode(new Uint8Array(response.stream.data)) : null
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
        error: assert.error ? _.pick(assert.error, ['name','message','stack']) :  null,
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
                name: req.item.name || '',
                request: _buildRequestObject(req.request),
                response: req.response ? _buildResponseObject(req.response, skipResponse): null,
                error: req.requestError || null,
                tests: _buildTestObject(req.assertions),
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
    if(!runOptions || !runSummary) {
        throw new Error('Cannot Build Run Payload without runOptions or RunSummary');
    }

    const run = {
        id: uuid4(),
        name: runOptions.collection.name || '',
        status:'finished', // THis can be finished or failed - Check with Harsh about all the possible values
        source: NEWMAN_STRING,
        failedTestCount: runSummary.run.stats.assertions.failed || 0,
        totalTestCount: runSummary.run.stats.assertions.total || 0,
        collection: runOptions.collectionID || '',
        environment: runOptions.environmentID || '',
        iterations: _executionToIterationConverter(runSummary.run.executions, runOptions.iterationCount , runOptions.publishSkipResponse),
        delay: runOptions.delayRequest || 0,
        persist: false,
        saveResponse: !runOptions.publishSkipResponse,
        dataFile: runOptions.collectionUID && runOptions.environmentUID ? runOptions.iterationData : null,
        workspace: runOptions.publish,
        currentIteration: runOptions.iterationCount,
        folder: null // This is always null as you cannot run a folder via newman
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

    if(!runOptions.postmanApiKey){
        throw new Error(`Postman API Key was not provided. Couldn't upload the results to Postman`);
    }

    runOptions.collectionID = util.extractResourceID(runOptions.collection);
    runOptions.environmentID = util.extractResourceID(runOptions.environment);

     try{
         runPayload = _buildPostmanUploadPayload(runOptions, runSummary)

        }catch(error){

        return Promise.reject(new Error(`Unable to serialize the run - ${error}`));
    }

    console.log('Umed RUN payload', runPayload);
    console.log();

    print.lf('Uploading newman run to Postman');

    const uploadOptions = {
        url: `${UPLOAD_RUN_API_URL}?workspace=${runOptions.publish}`,
        body: runPayload,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': runOptions.postmanApiKey
        }
    },
    retryOptions = {
        maxRetries: runOptions.publishRetries || 3,
        totalTimeout: runOptions.publishTimeout * 1000 || 60 * 1000,
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
    _buildPostmanUploadPayload,
    _executionToIterationConverter,
    _buildRequestObject,
    _buildResponseObject,
    _buildTestObject,
    _uploadWithRetry,
    _upload,

};
