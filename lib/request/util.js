const curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection,

    // converts the string curl command to a Postman Collection
    convertCurltoCollection = function (curlString, callback) {
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
    };

module.exports = { convertCurltoCollection };
