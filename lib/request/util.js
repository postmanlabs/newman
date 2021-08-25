const curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection,
    { ALL_CURL_OPTIONS } = require('./constants.js'),
    _ = require('lodash');

module.exports = {
    // converts the string curl command to a Postman Collection
    convertCurltoCollection: (curlString, callback) => {
        curl2postman.convert({ type: 'string', data: curlString }, function (err, operationResult) {
            if (err) {
                return callback(err);
            }

            if (!operationResult.result) {
                return callback(operationResult.reason);
            }

            const collection = new Collection();

            collection.items.add({
                name: operationResult.output[0] && operationResult.output[0].data.name,
                request: operationResult.output[0] && operationResult.output[0].data
            });

            return callback(null, collection);
        });
    },

    /**
     * Extract curl options in the provided options.
     * Create curl  command from the options.
     *
     * @param {Object} options - Commander.Command Instance
     * @returns {String} - Curl command
     */
    createCurl: (options) => {
        if (!options.url) {
            return undefined;
        }

        const
            // Get all curl option names
            allCurlOptions = Object.keys(ALL_CURL_OPTIONS),

            // Exclude non curl options
            curlOptions = _.reduce(options, (result, value, key) => {
                const validProp = _.includes(allCurlOptions, key);

                validProp && (result[key] = value);

                return result;
            }, {}),

            // method to convert the user option object to string
            curlOptionToString = (curlOptionName, userOptionValue) => {
                const curlOption = ALL_CURL_OPTIONS[curlOptionName];

                if (curlOption.collectValues && userOptionValue.length > 0) {
                    const optionsValue = userOptionValue.map((option) => {
                        return `${curlOption.long} '${option}'`;
                    }).join(' ');

                    return optionsValue;
                }

                if (curlOption.format && userOptionValue.length > 0) {
                    return `${curlOption.long} '${userOptionValue}'`;
                }

                if (!curlOption.format) {
                    return `${curlOption.long}`;
                }

                return '';
            },

            userOptionsString = Object.entries(curlOptions).map(([optionName, optionValue]) => {
                return curlOptionToString(optionName, optionValue);
            }).filter(Boolean).join(' ');

        return `curl ${userOptionsString} ${options.url}`;
    }
};
