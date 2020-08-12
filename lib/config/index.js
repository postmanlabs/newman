var _ = require('lodash'),
    async = require('async'),

    env = require('./process-env'),
    defaults = require('./defaults'),
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
 * @param {Function} callback - Is called after merging values from the overrides with the values from the rc file and
 * environment variables.
 * @returns {*}
 */
module.exports.get = (cliOptions, options, callback) => {
    var { command } = options;

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
        !options.ignoreProcessEnvironment ? env.load : (cb) => {
            return cb(null, {});
        }
    ], (err, options) => {
        if (err) {
            return callback(err);
        }

        let [, rcOptions] = options,
            aliasDetails;

        // get options specific to the command
        options = _.map(options, (obj) => {
            return obj && obj[command] ? obj[command] : {};
        });

        // merge the options from all the sources
        options = _.assignWith({}, ...options, cliOptions, (dest, src) => {
            // If the newer value is a null, do not override it.
            return (src === null) ? dest : undefined;
        });

        // if the postmanApiKey is not available, store the details of the session-api-key-alias in its place
        if (!options.postmanApiKey) {
            rcOptions.login &&
                ([aliasDetails] = _.filter(rcOptions.login._profiles, ['alias', options.postmanApiKeyAlias]));

            aliasDetails && (options.postmanApiKey = aliasDetails);
        }

        // delete the api-key-alias since the corresponding information is already acquired and the library-run
        // doesn't take alias as an input
        delete options.postmanApiKeyAlias;

        return callback(null, options);
    });
};
