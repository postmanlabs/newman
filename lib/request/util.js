var curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection;

const convert = function (value, callback) {
    let collection = new Collection();

    curl2postman.convert({ type: 'string', data: value }, function (err, result) {
        if (err) {
            return callback(err);
        }
        collection.items.add({
            name: result.output[0] && result.output[0].data.name,
            request: result.output[0] && result.output[0].data
        });
    });

    return collection;
};

module.exports = { convert };
