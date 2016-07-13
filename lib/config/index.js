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
 * @param {Boolean} options.ignoreRcFile - If true, the RC file is ignored.
 * @param {Boolean} options.ignoreProcessEnvironment - If true, the process environment
 * variables are ignored.
 * @param {function} callback - Is called after merging values from the overrides with the
 * values from the rc file and environment variables.
 */
module.exports.get = (overrides, options, callback) => {
    !callback && _.isFunction(options) && (callback = options, options = {});

    async.waterfall([
        // Load RC Files.
        !options.ignoreRcFile ? rcfile.load : (cb) => {
            cb(null, {});
        },
        // Load Process Environment overrides
        (fileOptions, cb) => {
            cb(null, _.merge(fileOptions, options.ignoreProcessEnvironment ? {} : env));
        }
    ], (err, options) => {
        if (err) {
            return callback(err);
        }

        options = _.mergeWith({}, options, overrides, (dest, src) => {
            if (src === null) {  // do not override original value if the new value is "null".
                return dest;
            }
        });
        callback(null, options);
    });
};
