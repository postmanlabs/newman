const util = require('../util');

const _ = require('lodash'),
print = require('../print'),
retry = require('async-retry'),
request = require('postman-request'),
ERROR_GO_TO_LINK = '<TBA>',
UPLOAD_RUN_API_URL = '<TBA>'

// Adapter to convert emitter.summary Object to Run Payload Object
// Discuss with Harsh to finalize the structure
const buildRunObject = (runSummary, collectionUID, environmentUID) => {
    // Here we also handle the --publish-no-response-content content - should I internally circum navigate it to --headless ?

    // const run = {
    //     collectionName: '', // This is needed to name the run.
    //     owner: '', // can be extracted from API key ?,
    //     workspaceId: uploadConfig.publishWorkspace || '',
    //     team: '', // can be extracted from API key,
    //     collection: collectionUID || '',
    //     folder: '',
    //     environment: environmentUID || '' , // environment-uid,
    //     status: 'Success/Errored', // what are its values ? Newman can only have Success / Errored
    //     source: 'newman',
    //     delay: 0, // options.delayRequest,
    //     persist: false, // bool - that tells us if we have saved the cookies , Will always be false be in newman
    //     totalTestCount: runSummary.run.stats.assertions.total,
    //     failedTestCount: runSummary.run.stats.assertions.failed,
    //     iterations: runSummary.run.stats.iterations.total, // Check what it is, since its a text , I expected it to be number
    //     totalTime:  runSummary.run.timings.completed - runSummary.run.timings.started,
    //     count: '<int>',// What is this ?? ,
    //     totalFail: '<int>', // is this the total nunber of requests failed ? seems similar to failedTestCount
    //     totalPass: '<int>', // is this the total number of requests passed ? seems similar to totalTestCount
    //     results: JSON.stringify({runSummary.run.executions}), // all the indiviual requests
    //     createdAt: Date.now(),
    //     failures: JSON.stringify({runSummary.run.failures}), // these are all the failures
    //     error: '' // Any fatal error during the run that caused the run to abort prematurely,
    // };

    // return run
}

class uploadRunToPostman{

    constructor(uploadConfig, runSummary){
        this.uploadConfig = uploadConfig,
        this.runSummary = runSummary;
    }

    /**
     * TBA
     * @param {*} runSummary
     * @param {*} collectionUID
     * @param {*} environmentUID
     */
    buildRunObject = ( runSummary, collectionUID , environmentUID ) => {}

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
                        return reject(`Retrying because of server error: ${body.message}`);
                    }

                    return reject(); // This should not be activated ( Discuss with Harsh , how to handle 3xx )
                })
            );
    }

    /**
     * @private
     * Internal upload function which handles the retry
     *
     * @param {*} uploadOptions
     * @param {*} retryOptions
     * @returns {Promise}
     */
    _uploadWithRetry = (upload, retryOptions) => {
        return retry( upload,{
            retries: retryOptions.maxRetries,
            factor: retryOptions.retryDelayMultiplier,
            randomize: retryOptions.addJitter || false,
            maxRetryTime: retryOptions.maxRetryDelay * 1000 , // converting to ms
            maxTimeout: retryOptions.totalTimeout * 1000, // converting to ms
            onRetry: retryOptions.onRetry || function(){} // e
        });
    }

    /**
     * @public
     * Starts the run upload process
     *
     * @returns {Boolean}  Indicate if run upload was successful
     */
    start = async () => {
        if(!this.uploadConfig.publishWorkspace){
            return true;
        }

        if(!this.uploadConfig.postmanApiKey){
            print.lf('Postman API Key was not provided , cannot upload newman run w/o Postman API Key');
            return false;
        }

        print.lf('Uploading newman run to Postman');

        const run = this.buildRunObject(runSummary, uploadConfig.publishWorkspaceSkipResponse);

        const uploadOptions = {
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
            const response = await this._uploadWithRetry(this._upload(uploadOptions), retryOptions)

            print.lf(`Uploaded the newman run to postman.
                    Visit ${response.message} to view the results in postman web`);
            return true;

        } catch(error) {
            print.lf(`Unable to upload the results to Postman:
                      Reason: ${error.message}
                      You can find solutions to common upload errors here: ${ERROR_GO_TO_LINK}`);
            return false;
        }
    }
}

module.exports = uploadRunToPostman;
