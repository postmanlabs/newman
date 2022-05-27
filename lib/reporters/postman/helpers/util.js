const _ = require('lodash'),
    {
        COLLECTION_UID_FROM_URL_EXTRACTION_PATTERN,
        ENVIRONMENT_UID_FROM_URL_EXTRACTION_PATTERN,
        API_KEY_FROM_URL_EXTRACTION_PATTERN
    } = require('./constants');

/**
 * Extracts the collection id
 *
 * @private
 * @param {String} resourceUrl - should be of the form `https://api.getpostman.com/collections/:collection-id
 * @returns {String}
 */
function _extractCollectionId (resourceUrl) {
    if (!_.isString(resourceUrl)) {
        return '';
    }

    const result = COLLECTION_UID_FROM_URL_EXTRACTION_PATTERN.exec(resourceUrl);

    if (result) {
        // The returned array has the matched text as the first item and then
        // one item for each parenthetical capture group of the matched text.
        return _.nth(result, 1);
    }

    return '';
}

/**
 * Extracts the environment id
 *
 * @private
 * @param {String} resourceUrl - should be of the form `https://api.getpostman.com/environments/:environment-id
 * @returns {String}
 */
function _extractEnvironmentId (resourceUrl) {
    if (!_.isString(resourceUrl)) {
        return '';
    }

    const result = ENVIRONMENT_UID_FROM_URL_EXTRACTION_PATTERN.exec(resourceUrl);

    if (result) {
        // The returned array has the matched text as the first item and then
        // one item for each parenthetical capture group of the matched text.
        return _.nth(result, 1);
    }

    return '';
}

/**
 * Goes through the CLI args and matches every arg against postman api URL pattern.
 * Returns the extracted api key if found
 *
 * @param {Array} args - An array of the current process args, passed via process.argv
 * @returns {String}
 */
function getAPIKeyFromCLIArguments (args) {
    let apiKey = '';

    if (!_.isArray(args) || _.isEmpty(args)) {
        return apiKey;
    }

    _.forEach(args, (arg) => {
        const result = API_KEY_FROM_URL_EXTRACTION_PATTERN.exec(arg);

        if (result) {
            apiKey = _.nth(result, -1);

            return false;
        }

        return true;
    });

    return apiKey;
}

/**
 * Goes through the CLI args and matches every arg against the fixed resource URL pattern.
 * Returns the extracted collection and environment ids if present:
 * {
 *  collection: '123456-dd79df3b-9fcq-dqwer-a76d-eab7e5d5d3b3',
 *  environment: '123456-dd79df3b-9fca-qwdq-dq2w-eab7e5d5d3b3'
 * }
 *
 * @param {Array} args - An array of the current process args, passed via process.argv
 * @returns {Object}
 */
function parseCLIArguments (args) {
    const result = {
        collection: '',
        environment: ''
    };

    if (!_.isArray(args) || _.isEmpty(args)) {
        return result;
    }

    let collectionId, environmentId;

    _.forEach(args, (arg) => {
        !collectionId && (collectionId = _extractCollectionId(arg));
        !environmentId && (environmentId = _extractEnvironmentId(arg));

        collectionId && (result.collection = collectionId);
        environmentId && (result.environment = environmentId);

        // Both the ids are found, break the forEach loop
        if (result.collection && result.environment) {
            return false;
        }

        return true;
    });

    return result;
}

module.exports = {
    parseCLIArguments,
    getAPIKeyFromCLIArguments
};
