const runtime = require('postman-runtime'),
    util = require('./util');

module.exports = function (options, callback) {
    util.convertCurltoCollection(options.curl, function (err, curlCollection) {
        if (err) {
            callback(err); // eslint-disable-line
        }
        const runner = new runtime.Runner();

        runner.run(curlCollection, {}, function (err, runResult) {
            console.log(err); // eslint-disable-line
            console.log(runResult); // eslint-disable-line
            if (err) {
                return callback(err);
            }

            return callback(null, runResult);
        });
    });
};

