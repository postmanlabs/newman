const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    prompts = require('prompts'),
    rcfile = require('../config/rc-file'),
    env = require('../config/process-env'),
    util = require('../util'),

    ALIAS = 'alias',
    DEFAULT = 'default',
    USER_PERMISSION = 'userPermission',

    LOGOUT_CONFIRMATION = (alias) => {
        return alias === DEFAULT ? 'Are you sure you want to delete the default API Key?' :
            `Are you sure you want to delete API Key with alias \`${alias}\`?`;
    },

    ALIAS_INPUT_PROMPT = 'Select the alias',
    ABORT_MESSAGE = 'Logout aborted.',
    NO_APIKEY_AVAILABLE = 'No API Key available.' +
        '\n   Use the login command to store an API Key.',
    ALIAS_NOT_PRESENT = 'Alias not present.';

/**
 * Displays all the available aliases and deletes the selected alias from the home-rc-file.
 *
 * @param {Function} callback - The callback to be invoked after the process
 * @returns {*}
 */
module.exports = (callback) => {
    let fileData,
        alias;

    waterfall([
        // get the data from home-rc-file
        // this is done in the beginning to prevent errors caused by file-load in between the logout-process
        rcfile.load,

        // load the session alias from the environment
        (data, next) => {
            fileData = data; // store the file-data for later use

            env.load((err, envOptions) => {
                if (err) { return next(err); }

                return next(null, _.get(envOptions, 'logout.postmanApiKeyAlias'));
            });
        },

        // display all the options and facilitate navigation between the same
        (sessionAlias, next) => {
            let profiles,
                initialProfile,
                promptOptions;

            fileData.login && (profiles = fileData.login._profiles);

            if (_.isEmpty(profiles)) {
                return next(NO_APIKEY_AVAILABLE);
            }

            if (profiles.length === 1) {
                alias = _.head(profiles).alias; // note the selected alias for later use

                return next(null);
            }

            promptOptions = {
                type: 'autocomplete',
                name: ALIAS,
                message: ALIAS_INPUT_PROMPT,
                choices: _.map(profiles, (profile) => { return { title: profile.alias }; }),
                initial: sessionAlias
            };

            // the initial option will be the session-alias, if any
            [initialProfile] = _.filter(profiles, [ALIAS, sessionAlias]);
            initialProfile && (promptOptions.initial = initialProfile.alias);

            util.signal(ALIAS);
            prompts(promptOptions)
                .then((response) => {
                    // on pressing ctrl-c
                    if (!_.has(response, ALIAS)) {
                        process.exit(1);
                    }

                    alias = response.alias; // note the selected alias for later use

                    // on entering an alias not present among the options
                    if (!alias) {
                        return next(ALIAS_NOT_PRESENT);
                    }

                    return next(null);
                })
                .catch(next);
        },

        (next) => {
            let promptOptions = {
                type: 'toggle',
                name: USER_PERMISSION,
                message: LOGOUT_CONFIRMATION(alias),
                active: 'Yes',
                inactive: 'No',
                initial: true
            };

            util.signal(USER_PERMISSION);
            prompts(promptOptions)
                .then((response) => {
                    // on pressing ctrl-c
                    if (!_.has(response, USER_PERMISSION)) {
                        process.exit(1);
                    }

                    if (!response.userPermission) {
                        return next(ABORT_MESSAGE);
                    }

                    return next(null);
                })
                .catch(next);
        },

        // delete the data related to the alias selected
        (next) => {
            fileData.login._profiles = _.reject(fileData.login._profiles, [ALIAS, alias]);

            return next(null, fileData);
        },

        // write the edited file data back
        rcfile.store

    ], callback);
};
