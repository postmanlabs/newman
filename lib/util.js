var _ = require('lodash'),
    request = require('postman-request'),
    parseJson = require('parse-json'),
    fs = require('fs'),
    version = require('../package.json').version,

    USER_AGENT_VALUE = 'Newman/' + version;

module.exports = {

    /**
     * The user agent that this newman identifies as.
     *
     * @type {String}
     */
    userAgent: USER_AGENT_VALUE,

    /**
     * Loads JSON data from the given location.
     *
     * @param {String} location - Can be an HTTP URL or a local file path.
     * @param {Object=} options - A set of options for JSON data loading.
     * @param {Object} options.apikey - Postman's cloud API Key (if the resource is being loaded from Postman Cloud).
     * @param {Function} callback - The function whose invocation marks the end of the JSON fetch routine.
     * @returns {*}
     */
    fetchJson: function (location, options, callback) {
        !callback && _.isFunction(options) && (callback = options, options = {});
        return (/^https?:\/\/.*/).test(location) ?
            // Load from URL
            request.get({
                url: location,
                json: true,
                headers: { 'User-Agent': USER_AGENT_VALUE }
            }, (err, response, body) => {
                if (err) {
                    return callback(_.set(err, 'help', `unable to fetch data from url "${location}"`));
                }

                try {
                    _.isString(body) && (body = parseJson(body));
                }
                catch (e) {
                    return callback(_.set(e, 'help', `the url "${location}" did not provide valid JSON data`));
                }

                return callback(null, body);
            }) :
            fs.readFile(location, function (err, value) {
                if (err) {
                    return callback(_.set(err, 'help', `unable to read data from file "${location}"`));
                }

                try {
                    value = parseJson(value.toString());
                }
                catch (e) {
                    return callback(_.set(e, 'help', `the file at ${location} does not contain valid JSON data`));
                }

                return callback(null, value);
            });
    },

    /**
     * Loads raw data from a location, useful for working with non JSON data such as CSV files.
     *
     * @param {String} location - The relative path / URL to the raw data file.
     * @param {Object=} options - A set of load options for the raw data file.
     * @param {Function} callback - The callback function whose invocation marks the end of the fetch routine.
     * @returns {*}
     */
    fetch: function (location, options, callback) {
        !callback && _.isFunction(options) && (callback = options, options = {});
        return (/^https?:\/\/.*/).test(location) ?
            // Load from URL
            request.get({ url: location }, (err, response, body) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, body);
            }) :
            fs.readFile(location, function (err, value) {
                if (err) {
                    return callback(err);
                }
                return callback(null, value.toString());
            });
    }
};
