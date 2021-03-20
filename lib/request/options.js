var _ = require('lodash'),
    util = require('../util'),
    config = require('../config'),
    curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection,


    /**
     * Custom configuration loaders for the required configuration keys.
     *
     * @type {Object}
     */
    configLoaders = {
            curl: (value, options, callback) => {

            let collection = new Collection();

            curl2postman.convert({ type: 'string', data: value }, function (err, result) {
                if (err) {
                     // @todo :do error handling with proper error messages 
                    return callback(err);
                }
                collection.items.add({
                    name: result.output[0] && result.output[0].data.name,
                    request: result.output[0] && result.output[0].data
                });
            });

                callback(null, collection);
            }
       
        };

/**
 * The helper function to load all file based information for the current collection run.
 *
 * @param {Object} options - The set of generic collection run options.
 * @param {Function} callback - The function called to mark the completion of the configuration load routine.
 * @returns {*}
 */
module.exports = function (options, callback) {
    // set newman version used for collection run
    options.newmanVersion = util.version;

    // set working directory if not provided
    options.workingDir = options.workingDir || process.cwd();

    // allow insecure file read by default
    options.insecureFileRead = Boolean(_.get(options, 'insecureFileRead', true));

    config.get(options, { loaders: configLoaders, command: 'request' }, function (err, result) {
        if (err) { return callback(err); }

        !_.isEmpty(options.globalVar) && _.forEach(options.globalVar, function (variable) {
            variable && (result.globals.set(variable.key, variable.value));
        });

        !_.isEmpty(options.envVar) && _.forEach(options.envVar, function (variable) {
            variable && (result.environment.set(variable.key, variable.value));
        });

        callback(null, result);
    });
};
