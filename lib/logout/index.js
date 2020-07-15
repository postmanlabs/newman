const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    colors = require('colors/safe'),
    readline = require('readline'),
    rcfile = require('../config/rc-file'),
    env = require('../config/process-env'),
    print = require('../print'),
    util = require('../util'),

    ALIAS = 'alias',
    DEFAULT = 'default',

    ALIAS_INPUT_PROMPT = 'Select the alias',
    NO_ALIAS_AVAILABLE = 'No aliases are available.',
    SUCCESS_MESSAGE = (alias) => { return `${alias} logged out successfully.`; },
    PROFILE_OPTION = (profile) => { return `   ${profile.alias}`; },
    HIGHLIGHTED_PROFILE_OPTION = (profile) => { return ' * ' + colors.green(profile.alias); };

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

            // @todo: Replace with the updated process-env
            next(null, env.postmanApiKeyAlias);
        },

        // display all the options and facilitate navigation between the same
        (sessionAlias, next) => {
            let profiles,
                currentProfile;

            fileData.login && (profiles = fileData.login._profiles);

            if (_.isEmpty(profiles)) {
                return next(NO_ALIAS_AVAILABLE);
            }

            if (profiles.length === 1) {
                alias = _.head(profiles).alias; // note the selected alias for later use

                return next(null);
            }

            // the initial option will be either the session-alias or 'default'
            [currentProfile] = _.filter(profiles, [ALIAS, sessionAlias || DEFAULT]);
            !currentProfile && (currentProfile = _.head(profiles));

            // display the prompt and all the choices
            console.info(colors.yellow.bold(ALIAS_INPUT_PROMPT));
            _.forEach(profiles, (profile) => {
                if (profile === currentProfile) {
                    console.info(HIGHLIGHTED_PROFILE_OPTION(profile));
                }
                else {
                    console.info(PROFILE_OPTION(profile));
                }
            });

            // move the highlighted option by the required amount
            var displace = (change) => {
                    let currentIndex = _.findIndex(profiles, currentProfile),
                        nextIndex = (currentIndex + change + profiles.length) % profiles.length;

                    // remove the highlight from the current profile
                    print.displacedWrite(PROFILE_OPTION(currentProfile), 0, -(profiles.length - currentIndex));
                    currentProfile = profiles[nextIndex];
                    // highlight the updated profile
                    print.displacedWrite(HIGHLIGHTED_PROFILE_OPTION(currentProfile), 0, -(profiles.length - nextIndex));
                },

                // keypress listener to navigate between the alias options
                keyPressListener = (_str, key) => {
                    switch (key.name) {
                        case 'up':
                            displace(-1);
                            break;

                        case 'down':
                            displace(1);
                            break;

                        case 'return':
                            process.stdin.removeListener('keypress', keyPressListener);

                            process.stdin.isTTY && process.stdin.setRawMode(false); // reset the behaviour of stdin
                            process.stdin.pause(); // else the program won't terminate

                            alias = currentProfile.alias; // note the selected alias for later use

                            return next(null);

                        case 'c':
                            // terminate the process on ctrl-C
                            if (key.ctrl) { process.exit(1); }

                            break;

                        // no default
                    }
                };

            process.stdin.isTTY && process.stdin.setRawMode(true); // listen to one key at a time
            readline.emitKeypressEvents(process.stdin);

            process.stdin.on('keypress', keyPressListener);
            util.signal(ALIAS);
        },

        // delete the data related to the alias selected
        (next) => {
            fileData.login._profiles = _.reject(fileData.login._profiles, [ALIAS, alias]);

            return next(null, fileData);
        },

        // write the edited file data back
        rcfile.store

    ], (err) => {
        if (err) {
            return callback(err);
        }

        console.info(SUCCESS_MESSAGE(alias));

        return callback(null);
    });
};
