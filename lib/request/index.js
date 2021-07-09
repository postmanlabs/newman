const runtime = require('postman-runtime'),
    util = require('./util'),
    Collection = require('postman-collection').Collection;

module.exports = function (options, callback) {
    const runner = new runtime.Runner();
    let collection = new Collection();

    util.convertCurltoCollection(options.curl, function (err, result) {
        if (err) {
            callback(err); // eslint-disable-line
        }
        collection = result;
    });

    runner.run(collection, {}, function (err, run) {
        console.log(err); // eslint-disable-line
        console.log(run); // eslint-disable-line
    });
};

