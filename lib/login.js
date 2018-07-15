const _ = require('lodash'),
    keytar = require('keytar'),

    SERVICE = 'newman';

module.exports = {
    /**
     * Logs a user in by adding their Postman API Key to the system keychain.
     *
     * @param {Object} options - The set of login options.
     * @param {String} options.apiKey - The Postman API Key to set in the OS keychain.
     * @param {Function} cb - The callback invoked when the password set attempt has been completed.
     * @todo: Update the method signature to include an optional account when supported.
     */
    login ({ apiKey }, cb) {
        if (!apiKey || !_.isString(apiKey)) {
            return cb(new Error('A non-empty apiKey string is needed in the options'));
        }

        return keytar
            // @todo: Research the effects of renaming a user
            .setPassword(SERVICE, process.env.USER || 'user', apiKey) // eslint-disable-line no-process-env
            .then(() => {
                cb(null, { success: true });
            }, cb)
            .catch(cb);
    },

    /**
     * Logs a user out by purging their Postman API key from the OS keychain
     *
     * @param {Function} cb - The callback invoked when the logout attempt has completed.
     * @todo: Update the method signature to include an optional account when supported, similar to login
     */
    logout (cb) {
        keytar
            // @todo: Research the effects of renaming a user
            .deletePassword(SERVICE, process.env.USER || 'user') // eslint-disable-line no-process-env
            .then((result) => {
                cb(null, { success: result });
            }, cb)
            .catch(cb);
    }
};
