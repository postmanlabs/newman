const _ = require('lodash'),
print = require('../print'),
retry = require('async-retry'),
request = require('postman-request/request'),
ERROR_GO_TO_LINK = '<TBA>',
UPLOAD_RUN_API_URL = '<TBA>',
PROCESS_EXIT_SUCCESS = 0,
PROCESS_EXIT_FAIL = 1;

// Adapter to convert emitter.summary Object to Run Payload Object
// Discuss with Harsh to finalize the structure
const buildRunObject = (runSummary, collectionUID, environmentUID) => {}

/**
 * Internal upload call
 *
 * @param {Object} uploadOptions
 * @returns {function} Returns an async function which can be used by async-retry library to have retries
 */
const _upload = (uploadOptions) => {
    return async(bail) => {
        await new Promise((resolve, reject) => {
            request(uploadOptions , (error, response, body) => {
                if(error){
                    return reject(error); // Retry since the Error will be ERRCONNECT
                }

                if(200 <= response.statusCode && response.statusCode <= 299){
                    return resolve(body);
                }

                if( 400 <= response.statusCode && response.statusCode<= 499){
                    bail(new Error(body.message)); // Avoid retry if there is client side error ( API key error / Workspace ID / permission error)
                    return;
                }

                if( 500 <= response.statusCode && response.statusCode <= 599){ // Perform Retry if Server side Error
                    return reject(`Retrying because of server error: ${body.message}`);
                }

                return reject(); // This should not be activated ( Discuss with Harsh)
            });
        });
    }
}

/**
 * Internal upload function which handles the retry
 *
 * @param {*} uploadOptions
 * @param {*} retryOptions
 * @returns {Promise}
 */
const _uploadWithRetry = (uploadOptions, retryOptions) => {
    const upload = _upload(uploadOptions)
    return retry( upload,{
        retries: retryOptions.maxRetries,
        factor: retryOptions.retryDelayMultiplier,
        randomize: retryOptions.addJitter || false,
        maxRetryTime: retryOptions.maxRetryDelay * 1000 , // converting to ms
        maxTimeout: retryOptions.totalTimeout * 1000 // converting to ms
    });
}

/**
 * Uploads Newman Run Results to Postman
 *
 * @param {*} uploadConfig
 * @param {*} runSummary
 * @returns {Number} - The exit process code . Values can be - PROCESS_EXIT_SUCCESS or PROCESS_EXIT_FAIL constants
 */
const uploadRunToPostman = async(uploadConfig, runSummary) => {

    if(!uploadConfig.publishWorkspace){
        return PROCESS_EXIT_SUCCESS;
    }

    if(!uploadConfig.postmanApiKey){
        print.lf('Postman API Key was not provided , cannot upload newman run w/o Postman API Key');
        return PROCESS_EXIT_FAIL;
    }

    print.lf('Uploading newman run to Postman');

    const run = buildRunObject(runSummary, uploadConfig.publishWorkspaceSkipResponse);

    const uploadOptions = {
        method: 'POST',
        url: UPLOAD_RUN_API_URL,
        body: JSON.stringify(run),
        headers: {
            'Content-Type': 'application/json',
            'X-API-Header': uploadConfig.postmanApiKey
        }
    },
    retryOptions = {
        maxRetries: uploadConfig.publishRetry,
        totalTimeout: uploadConfig.publishUploadTimeout,
        retryDelayMultiplier: 2,
        maxRetryDelay : 64,
        addJitter: true
    };

    try{
        const response = await _uploadWithRetry(uploadOptions, retryOptions)

        print.lf(`Uploaded the newman run to postman.
                Visit ${response.message} to view the results in postman web`);
        return PROCESS_EXIT_SUCCESS;

    } catch(error) {
        print.lf(`Unable to upload the results to Postman:
                  Reason: ${error.message}
                  You can find solutions to common upload errors here: ${ERROR_GO_TO_LINK}`);
        return PROCESS_EXIT_FAIL;
    }
}

module.exports = uploadRunToPostman;
