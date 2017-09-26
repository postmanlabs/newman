var fs = require('fs'),
    url = require('url'),

    _ = require('lodash'),
    prettyms = require('pretty-ms'),
    filesize = require('filesize'),
    request = require('postman-request'),
    parseJson = require('parse-json'),

    util,
    version = require('../package.json').version,

    SEP = ' / ',

    /**
     * The auxiliary character used to prettify file sizes from raw byte counts.
     *
     * @type {Object}
     */
    FILESIZE_OPTIONS = { spacer: '' },

    PRO_API_HOST = 'api.getpostman.com',
    USER_AGENT_VALUE = 'Newman/' + version;

util = {

    /**
     * The raw newman version, taken from package.json in the root directory
     *
     * @type {String}
     */
    version: version,

    /**
     * The user agent that this newman identifies as.
     *
     * @type {String}
     */
    userAgent: USER_AGENT_VALUE,

    /**
     * A utility helper method that prettifies and returns raw millisecond counts.
     *
     * @param {Number} ms - The raw millisecond count, usually from response times.
     * @returns {String} - The prettified time, scaled to units of time, depending on the input value.
     */
    prettyms: function (ms) {
        return (ms < 1998) ? `${parseInt(ms, 10)}ms` : prettyms(ms || 0);
    },

    /**
     * A utility helper method to prettify byte counts into human readable strings.
     *
     * @param {Number} bytes - The raw byte count, usually from computed response sizes.
     * @returns {String} - The prettified size, suffixed with scaled units, depending on the actual value provided.
     */
    filesize: function (bytes) {
        return filesize(bytes || 0, FILESIZE_OPTIONS);
    },

    /**
     * Resolves the fully qualified name for the provided item
     *
     * @param {PostmanItem|PostmanItemGroup} item The item for which to resolve the full name
     * @param {?String} [separator=SEP] The separator symbol to join path name entries with
     * @returns {String} The full name of the provided item, including prepended parent item names
     * @private
     */
    getFullName: function (item, separator) {
        if (_.isEmpty(item) || !_.isFunction(item.parent) || !_.isFunction(item.forEachParent)) { return; }

        var chain = [];
        item.forEachParent(function (parent) { chain.unshift(parent.name || parent.id); });

        item.parent() && chain.push(item.name || item.id); // Add the current item only if it is not the collection
        return chain.join(_.isString(separator) ? separator : SEP);
    },

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
                    _.isString(body) && (body = parseJson(body.trim()));
                }
                catch (e) {
                    return callback(_.set(e, 'help', `the url "${location}" did not provide valid JSON data`));
                }

                var error,
                    urlObj,
                    resource = 'resource';

                if (response.statusCode !== 200) {
                    urlObj = url.parse(location);

                    (urlObj.hostname === PRO_API_HOST) &&
                        (resource = _(urlObj.path).split('/').get(1).slice(0, -1) || resource);

                    error = new Error(_.get(body, 'error.message',
                        `Error fetching ${resource}, the provided URL returned status code: ${response.statusCode}`));

                    return callback(_.assign(error, {
                        name: _.get(body, 'error.name', _.capitalize(resource) + 'FetchError'),
                        help: `Error fetching the ${resource} from the provided URL. Ensure that the URL is valid.`
                    }));
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

module.exports = util;
