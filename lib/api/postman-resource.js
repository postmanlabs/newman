let _ = require('lodash'),
    util = require('../util'),

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

        if ((/^https?:\/\/.*/).test(location)) {
            this.url = location;
        }
        else {
            // build API URL if `location` is an UID/ID
            this.url = `${POSTMAN_API_URL}/${POSTMAN_API_PATH_MAP[type]}/${location}`;
        }
    }

    /**
     * Gets the remote resource using Postman-API
     *
     * @param {Function} callback - The function to be invoked after the load
     * @returns {*}
     */
    get (callback) {
        let headers = {
            ...DEFAULT_HEADERS,
            'X-Api-Key': this.apikey
        };

        return util.apiRequest('GET', {
            url: this.url,
            json: true,
            headers: headers,
            // Temporary fix to fetch the collection from https URL on Node v12
            // @todo find the root cause in postman-request
            // Refer: https://github.com/postmanlabs/newman/issues/1991
            agentOptions: {
                keepAlive: true
            }
        }, this.type, (err, response) => {
            if (err) { return callback(err); }

            // get the respective field from the body
            return callback(null, _.get(response, this.type));
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
        let headers = {
            ...DEFAULT_HEADERS,
            'X-Api-Key': this.apikey,
            'Content-Type': 'application/json'
        };

        (data = _.set({}, this.type, data)); // format the data to indicate the field

        return util.apiRequest('PUT', {
            url: this.url,
            headers: headers,
            body: JSON.stringify(data)
        }, this.type, callback);
    }
}

module.exports = PostmanResource;
