/**
 * An exhaustive set of constants used across various functions
 */
module.exports = {
    /**
     * Used as a source in the collection run object
     */
    NEWMAN_STRING: 'newman',

    /**
     * The status of the newman run in process
     */
    NEWMAN_RUN_STATUS_FINISHED: 'finished',

    /**
     * The success result of a particular test
     */
    NEWMAN_TEST_STATUS_PASS: 'pass',

    /**
     * The failure result of a particular test
     */
    NEWMAN_TEST_STATUS_FAIL: 'fail',

    /**
     * The skipped status of a particular test
     */
    NEWMAN_TEST_STATUS_SKIPPED: 'skipped',

    /**
     * Use this as a fallback collection name when creating collection run object
     */
    FALLBACK_COLLECTION_RUN_NAME: 'Collection Run',

    /**
     * The base URL for postman API
     */
    POSTMAN_API_BASE_URL: 'https://api.postman.com',

    /**
     * The API path used to upload newman run data
     */
    POSTMAN_API_UPLOAD_PATH: '/newman-runs',

    /**
     * Used as a fall back error message for the upload API call
     */
    RESPONSE_FALLBACK_ERROR_MESSAGE: 'Error occurred while uploading newman run data to Postman'
};
