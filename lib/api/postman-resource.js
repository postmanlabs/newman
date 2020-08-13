let _ = require('lodash'),
    util = require('../util'),
    request = require('postman-request'),
    liquidJSON = require('liquid-json'),

    /**
     * Map of resource type and its equivalent API pathname.
     *
     * @type {Object}
     */
    POSTMAN_API_PATH_MAP = {
        collection: 'collections',
        environment: 'environments'
    },

    POSTMAN_API_HOST = 'api.postman.com',

    POSTMAN_API_URL = 'https://' + POSTMAN_API_HOST,

    DEFAULT_HEADERS = {
        'User-Agent': util.userAgent
    },

    /**
     * Map of operation-name to the request-method
     *
     * @type {Object}
     */
    REQUEST_METHOD_MAP = {
        fetch: 'get',
        sync: 'put',
        delete: 'delete'
    },

    /**
     * Map of operation-name to the its verb form
     *
     * Used to form error messages
     *
     * @type {Object}
     */
    OPERATION_VERB_MAP = {
        fetch: 'fetching',
        sync: 'syncing',
        delete: 'deleting'
    },

    /**
     * Performs an operation on a given remote-resource using Postman-APIs
     *
     * @param {String} operation - The name of the operation, for eg: 'fetch', 'sync'
     * @param {PostmanResource} resource - The resource on which the operation has to be done
     * @param {Function} callback - The function to be invoked after the operation
     */
    remoteOperation = (operation, resource, callback) => {
        let { url, apikey, type, data } = resource,
            headers = {
                ...DEFAULT_HEADERS,
                'X-Api-Key': apikey
            },
            requestOptions = {
                url: url,
                headers: headers,
                json: true
            },
            requestMethod = REQUEST_METHOD_MAP[operation];

        if (operation === 'sync') {
            data = _.set({}, type, data); // format the data to indicate the field
            requestOptions.body = JSON.stringify(data);
            requestOptions.headers['Content-Type'] = 'application/json';
        }

        return request[requestMethod](requestOptions, (err, response, body) => {
            if (err) {
                return callback(_.set(err, 'help', `unable to ${operation} data from url "${url}"`));
            }

            try {
                _.isString(body) && (body = liquidJSON.parse(body.trim()));
            }
            catch (e) {
                return callback(_.set(e, 'help', `the url "${url}" did not provide valid JSON data`));
            }

            // if the status code is not in 200s, get the error from the body
            if (!(/2../).test(response.statusCode)) {
                var error;

                error = new Error(_.get(body, 'error.message', `Error ${OPERATION_VERB_MAP[operation]} ${type}, ` +
                    `the provided URL returned status code: ${response.statusCode}`));

                return callback(_.assign(error, {
                    name: _.get(body, 'error.name', _.capitalize(type) + _.capitalize(operation) + 'Error'),
                    help: `Error ${OPERATION_VERB_MAP[operation]} the ${type} from the provided URL. ` +
                        'Ensure that the URL is valid.'
                }));
            }

            return callback(null, body);
        });
    };

/** Class representing a resource in Postman-Cloud */
class PostmanResource {
    /**
     * Creates an instance of PostmanResource
     *
     * @param {String} type - The type of the resource, for eg: 'collection', 'environment' etc
     * @param {String} location - The UID/ID/URL representing the remote resource
     * @param {String} apikey - The API-Key to be used to perform operations on the resource
     */
    constructor (type, location, apikey) {
        this.type = type;
        this.apikey = apikey;
        this.data = undefined; // used to cache the resource to prevent repetitive network calls

        if ((/^https?:\/\/.*/).test(location)) {
            this.url = location;
        }
        else {
            // build API URL if `location` is an UID/ID
            this.url = `${POSTMAN_API_URL}/${POSTMAN_API_PATH_MAP[type]}/${location}`;
        }
    }

    /**
     * Gets the remote resource using Postman-API or the cached data
     *
     * @param {Function} callback - The function to be invoked after the load
     * @returns {*}
     */
    get (callback) {
        if (this.data) {
            return callback(null, this.data);
        }

        return remoteOperation('fetch', this, (err, response) => {
            if (err) { return callback(err); }

            // get the respective field from the body and cache it to prevent future remote-requests
            this.data = _.get(response, this.type);

            return callback(null, this.data);
        });
    }

    /**
     * Updates the remote resource using Postman-API
     *
     * @param {Object} data - The updated value of the resource
     * @param {Function} callback - The function to be invoked after the update
     * @returns {*}
     */
    update (data, callback) {
        this.data = data;

        return remoteOperation('sync', this, callback);
    }

    /**
     * Deletes the remote resource using Postman-API
     *
     * @param {Function} callback - The function to be invoked after the deletion
     * @returns {*}
     */
    delete (callback) {
        return remoteOperation('delete', this, callback);
    }
}

module.exports = PostmanResource;
