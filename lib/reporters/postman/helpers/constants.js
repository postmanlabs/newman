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
    POSTMAN_API_BASE_URL: 'https://api.getpostman.com',

    /**
     * The API path used to upload newman run data
     */
    POSTMAN_API_UPLOAD_PATH: '/newman-runs',

    /**
     * Used as a fall back error message for the upload API call
     */
    RESPONSE_FALLBACK_ERROR_MESSAGE: 'Something went wrong while uploading newman run data to Postman',

    /**
     * Regex pattern to extract the collection id from the postman api collection url
     */
    COLLECTION_UID_FROM_URL_EXTRACTION_PATTERN: /https?:\/\/api\.getpostman.*\.com\/(?:collections)\/([A-Za-z0-9-]+)/,

    /**
     * Regex pattern to extract the environment id from the postman api environment url
     */
    ENVIRONMENT_UID_FROM_URL_EXTRACTION_PATTERN: /https?:\/\/api\.getpostman.*\.com\/(?:environments)\/([A-Za-z0-9-]+)/,

    /**
     * Regex pattern to extract the api key from the postman api collection url
     */
    API_KEY_FROM_URL_EXTRACTION_PATTERN:
        /https:\/\/api.getpostman.com\/([a-z]+)s\/([a-z0-9-]+)\?apikey=([a-z0-9A-Z-]+)/,

    /**
     * Matches valid Postman UID, case insensitive.
     */
    UID_REGEX: /^[0-9A-Z]+-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
};
