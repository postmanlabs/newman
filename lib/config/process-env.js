var _ = require('lodash'),

    /**
     * List of options with env-support for each command.
     */
    config = {
        run: ['POSTMAN_API_KEY', 'POSTMAN_API_KEY_ALIAS']
    },

    /**
     * Gets the option corresponding to an env-variable.
     * Eg: NEWMAN_ALIAS -> alias
     *
     * @param {String} envVar - The environment variable
     * @returns {String} The option
     */
    getOption = (envVar) => {
        // ignore the prefix 'NEWMAN_' if it exists
        envVar = envVar.replace(/^NEWMAN_/, '');

        return _.camelCase(envVar);
    };

module.exports.load = (callback) => {
    let envConfig = {};

    _.forIn(config, (envVars, command) => {
        let commandOptions = envVars.reduce((obj, envVar) => {
            let key = getOption(envVar),
                // eslint-disable-next-line no-process-env
                value = _.get(process.env, envVar);

            value && (_.set(obj, key, value));

            return obj;
        }, {});

        _.set(envConfig, command, commandOptions);
    });

    return callback(null, envConfig);
};
