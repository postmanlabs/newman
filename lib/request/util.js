const curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection,
    convertCurltoCollection = function (curlString, callback) {
        curl2postman.convert({ type: 'string', data: curlString }, function (err, result) {
            if (err) {
                return callback(err);
            }
            if (!result.result) {
                return callback(result.reason);
            }
            let collection = new Collection();

            collection.items.add({
                name: result.output[0] && result.output[0].data.name,
                request: result.output[0] && result.output[0].data
            });
            callback(null, collection);
        });
    };

module.exports = { convertCurltoCollection };
