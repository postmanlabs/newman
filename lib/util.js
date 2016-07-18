var _ = require('lodash'),
    request = require('request'),
    parseJson = require('parse-json'),
    fs = require('fs');

module.exports = {
    /**
     * Loads JSON data from the given location.
     *
     * @param {string} location - Can be an HTTP URL or a local file path.
     * @param {object=} options
     * @param {object} options.apikey - Postman's cloud API Key (if the resource is being loaded from Postman Cloud)
     * @param callback
     */
    fetch: function (location, options, callback) {
        !callback && _.isFunction(options) && (callback = options, options = {});
        return (/^https?:\/\/.*/).test(location) ?
            // Load from URL
            request.get({ url: location, json: true }, (err, response, body) => {
                if (err) {
                    return callback(err);
                }

                try {
                    _.isString(body) && (body = parseJson(body));
                }
                catch (e) {
                    return callback(new Error('Given URL did not provide a valid JSON response: ', location));
                }

                return callback(null, body);
            }) :
            fs.readFile(location, function (err, value) {
                if (err) {
                    return callback(err);
                }

                try {
                    value = parseJson(value.toString());
                }
                catch (e) {
                    return callback(new Error('Given file does not contain valid JSON data: ', location));
                }

                return callback(null, value);
            });
    },

    /**
     * Creates a stream for loading data.
     *
     * @param {String} location
     * @param options
     * @param callback
     */
    fetchStream: function (location, options, callback) {
        !callback && _.isFunction(options) && (callback = options, options = {});

        return (/^https?:\/\/.*/).test(location) ?
            // Load from URL
            request.get({ url: location }) : fs.createReadStream(location);
    }
};
