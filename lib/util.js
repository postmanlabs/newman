var _ = require('lodash'),
    request = require('postman-request'),
    parseJson = require('parse-json'),
    fs = require('fs'),
    version = require('../package.json').version,

    USER_AGENT_VALUE = 'Newman/' + version;

module.exports = {
    /**
     * The user agent that this newman identifies as
     *
     * @type {String}
     */
    userAgent: USER_AGENT_VALUE,

    /**
     * Loads JSON data from the given location.
     *
     * @param {string} location - Can be an HTTP URL or a local file path.
     * @param {object=} options
     * @param {object} options.apikey - Postman's cloud API Key (if the resource is being loaded from Postman Cloud)
     * @param callback
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
     * Loads raw data from a location, useful for working with non JSON data,
     * such as CSV files.
     *
     * @param {String} location
     * @param options
     * @param callback
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
