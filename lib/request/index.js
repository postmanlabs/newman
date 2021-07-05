var runtime = require('postman-runtime'),
    curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection;

const req = function (options, callback) {
    let collection = new Collection();

    var runner = new runtime.Runner();

    curl2postman.convert({ type: 'string', data: options.curl }, function (err, result) {
        if (err) {
            return callback(err);
        }
        collection.items.add({
            name: result.output[0] && result.output[0].data.name,
            request: result.output[0] && result.output[0].data
        });
    });

    runner.run(collection, {}, function (err, run) {
        console.log(err); // eslint-disable-line
        console.log(run); // eslint-disable-line
    });
};

module.exports = req;
