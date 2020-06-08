const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    rcfile = require('../config/rc-file'),

    ALIAS = 'alias',

    USER_NOT_FOUND = 'User not found.',
    SUCCESS_MESSAGE = 'Logout successful.';


/**
 * Removes the authentication data of the user provided, from the rc file located in the HOME_DIR.
 *
 * @param {String} alias - The name of the user
 * @param {Function} [callback] - The callback to be invoked after the process
 * @returns {*}
 */
module.exports = (alias, callback) => {
    !_.isFunction(callback) && (callback = _.noop);

    waterfall([
        rcfile.loadHome,
        (fileData, next) => {
            let previousData = fileData.login && _.filter(fileData.login._profiles, [ALIAS, alias]);

            if (_.isEmpty(previousData)) {
                return next(new Error(USER_NOT_FOUND));
            }

            fileData.login._profiles = _.reject(fileData.login._profiles, [ALIAS, alias]);

            return next(null, fileData);
        },
        rcfile.storeHome
    ], (err) => {
        if (err) {
            return callback(err);
        }

        console.info(SUCCESS_MESSAGE);

        return callback(null);
    });
};
