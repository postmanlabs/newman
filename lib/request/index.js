const runtime = require('postman-runtime'),
    util = require('./util');

module.exports = function (options, callback) {
    const runner = new runtime.Runner();

    util.convertCurltoCollection(options.curl, function (err, curlCollection) {
        if (err) {
            callback(err); // eslint-disable-line
        }

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
