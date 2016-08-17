var _ = require('lodash'),
    async = require('async'),

    env = require('./process-env'),
    rcfile = require('./rc-file');

/**
 * Reads configuration from config file, environment variables and CLI arguments.
 * The CLI arguments override environment variables and environment variables override
 * the configuration read from a file.
 *
 * @param {object} overrides - Configuration overrides (these usually come from the CLI)
 * @param {object} options
 * @param {String} options.command - Command name. Used for loading the required options from the config file
 * @param {Boolean=} options.ignoreRcFile - If true, the RC file is ignored.
 * @param {Boolean=} options.ignoreProcessEnvironment - If true, the process environment
 * variables are ignored.
 * @param {Object=} options.loaders - Custom loaders for specific configuration options
 * @param {function} callback - Is called after merging values from the overrides with the
 * values from the rc file and environment variables.
 */
module.exports.get = (overrides, options, callback) => {
    !callback && _.isFunction(options) && (callback = options, options = {});

    var loaders = options.loaders;
    async.waterfall([
        // Load RC Files.
        !options.ignoreRcFile ? rcfile.load : (cb) => {
            return cb(null, {});
        },
        // Load Process Environment overrides
        (fileOptions, cb) => {
            fileOptions[options.command] && (fileOptions = fileOptions[options.command]);
            return cb(null, _.merge(fileOptions, options.ignoreProcessEnvironment ? {} : env));
        }
    ], (err, options) => {
        if (err) {
            return callback(err);
        }

        options = _.mergeWith({}, options, overrides, (dest, src) => {
            // If the newer value is a null, do not override it.
            return (src === null) ? dest : undefined;
        });

        if (_.isEmpty(loaders)) {
            return callback(null, options);
        }
        // sanitize environment option
        if (!options.environment) {
            options.environment = {};
        }
        // sanitize globals option
        if (!options.globals) {
            options.globals = {};
        }

        async.mapValues(options, (value, name, cb) => {
            return (value && _.isFunction(loaders[name])) ? loaders[name](value, cb) : cb(null, value);
        }, callback);
    });
};
