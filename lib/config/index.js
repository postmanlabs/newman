var _ = require('lodash'),
    async = require('async'),

    defaults = require('./defaults'),
    env = require('./process-env'),
    rcfile = require('./rc-file');

/**
 * Reads and merges configuration from default options, config file, environment variables and CLI arguments.
 * Priority among these configurations: CLI options > Environment variables > Config file > Default options
 *
 * @param {Object} cliOptions - The options passed from the CLI arguments.
 * @param {Object} options - The wrapper object of settings used for selective configuration loading.
 * @param {String} options.command - Command name. Used for loading the required options from the config file.
 * @param {Boolean=} options.ignoreRcFile - If true, the RC file is ignored.
 * @param {Boolean=} options.ignoreProcessEnvironment - If true, the process environment variables are ignored.
 * @param {Object=} options.loaders - Custom loaders for specific configuration options.
 * @param {Function} callback - Is called after merging values from the overrides with the values from the rc file and
 * environment variables.
 * @returns {*}
 */
module.exports.get = (cliOptions, options, callback) => {
    var { loaders, command } = options;

    async.parallel([
        // Load the default options for all commands
        defaults.load,

        // Load RC Files.
        (cb) => {
            if (options.ignoreRcFile) {
                return cb(null, {});
            }

            return rcfile.load(['home', 'cwd'], cb);
        },

        // Load Process Environment overrides
        !options.ignoreProcessEnvironment ? env : (cb) => {
            return cb(null, {});
        }
    ], (err, options) => {
        if (err) {
            return callback(err);
        }

        // get options specific to the command
        options = _.map(options, (obj) => {
            return obj && obj[command] ? obj[command] : {};
        });

        // merge the options from all the sources
        options = _.assignWith({}, ...options, cliOptions, (dest, src) => {
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

        let commonOptions = _.pick(options, ['postmanApiKey']);

        async.mapValues(options, (value, name, cb) => {
            return (value && _.isFunction(loaders[name])) ? loaders[name](value, commonOptions, cb) : cb(null, value);
        }, callback);
    });
};
