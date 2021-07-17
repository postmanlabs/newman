const _ = require('lodash'),
    runtime = require('postman-runtime'),
    util = require('./util');

module.exports = function (options, callback) {
    // validate all options. it is to be noted that `options` parameter is option and is polymorphic
    (!callback && _.isFunction(options)) && (
        (callback = options),
        (options = {})
    );
    !_.isFunction(callback) && (callback = _.noop);

    // ensure that the curl command is present before starting a run
    if (!_.isString(options.curl)) {
        return callback(new Error('expecting a valid curl command to run'));
    }

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
