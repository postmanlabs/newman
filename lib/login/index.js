const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    prompts = require('prompts'),
    rcfile = require('../config/rc-file'),
    print = require('../print'),
    util = require('../util'),
    crypt = require('../crypt'),

    DEFAULT = 'default',

    USER_ACTION = 'userAction',
    ALIAS = 'alias',
    OVERRIDE_PERMISSION = 'overridePermission',
    POSTMAN_API_KEY = 'postmanApiKey',
    ENCRYPTED = 'encrypted',
    PASSKEY = 'passkey',

    INPUT_PROMPTS = {
        userAction: 'Default authentication details already exist.\nChoose an option to continue',
        userActionChoices: [
            { title: 'Override it', value: 'override' },
            { title: 'Store as an alias', value: 'new_alias' },
            { title: 'Abort', value: 'abort' }
        ],
        alias: 'Alias',
        overridePermission: 'The alias already exists.\nDo you want to override it?',
        postmanApiKey: 'Postman API Key',
        encrypted: 'Do you want to have a passkey for authentication?',
        passkey: 'Passkey'
    },

    // Regular expression for Postman API Key in different versions
    V1_API_KEY_REGEX = /^[a-f0-9]{32}$/,
    V2_API_KEY_REGEX = /^(PMAK-[a-f0-9]{24}-[a-f0-9]{34})$/,

    INVALID_API_KEY = 'Invalid Postman API Key.',
    ABORT_MESSAGE = 'Login aborted.',
    INVALID_INPUT = 'Invalid input.';

/**
 * Gets the details of the alias from interaction and writes it in the config file located in the home directory.
 *
 * @param {Function} callback - The callback function to be invoked to mark the end of the function.
 * @returns {*}
 */
module.exports = (callback) => {
    let options = {},
        fileData,

        /**
         * Prompts the user for input, gets the same and stores it in the required field under `options`
         *
         * @param {String} field - The field to be asked for to the user
         * @param {Object} opts - Options related to the input
         * @param {Boolean} opts.type - The type of the input
         * @param {Boolean} opts.boolean - Indicates if the input field is boolean
         * @param {String[]} opts.choices - Input choices to be displayed
         * @param {String} opts.initial - Default value of the field, if any
         * @param {Function} cb - The callback to be invoked after storing the input
         */
        getData = async (field, opts, cb) => {
            let promptOptions = {
                type: opts.type,
                name: 'response',
                hint: ' ', // if not specified, the prompt shows the default hint
                message: (INPUT_PROMPTS[field])
            };

            if (opts.boolean) {
                promptOptions = {
                    ...promptOptions,
                    active: 'Yes',
                    inactive: 'No'
                };
            }

            if (opts.choices) {
                promptOptions = {
                    ...promptOptions,
                    choices: opts.choices
                };
            }

            !_.isUndefined(opts.initial) && (promptOptions.initial = opts.initial);

            util.signal(field); // signal the parent process(if any) for input
            var { response } = await prompts(promptOptions);

            if (_.isString(response) && field !== PASSKEY) {
                // trim all the string inputs except for the passkey
                response = response.trim();
            }

            _.set(options, field, response);

            // exit the program if Ctrl-C is pressed
            if (_.isUndefined(options[field])) {
                process.exit(1);
            }

            // pass the error if the input is empty
            if (options[field] === '') {
                return cb(INVALID_INPUT);
            }

            return cb(null);
        };

    waterfall([
        // get the data from home-rc-file
        // this is done in the beginning to prevent errors caused by file-load in between the login-process
        rcfile.load,

        // determine the action to be performed
        (data, next) => {
            fileData = data; // store the file-data for future use

            let defaultAliasDetails = _.has(fileData, 'login._profiles') &&
                _.filter(fileData.login._profiles, [ALIAS, DEFAULT]); // get the data related to `default` alias

            // store the input details under 'default' alias if no data is already present under it
            if (_.isEmpty(defaultAliasDetails)) {
                options.alias = DEFAULT;

                return next(null);
            }

            // if the `default` alias already exists, determine the action to be performed
            return getData(USER_ACTION,
                { type: 'select', choices: INPUT_PROMPTS.userActionChoices }, () => {
                    if (options.userAction === 'abort') {
                        process.exit(1);
                    }

                    print('\n');

                    if (options.userAction === 'override') {
                        options.alias = DEFAULT;

                        // delete the old data related to the alias
                        fileData.login._profiles = _.reject(fileData.login._profiles, [ALIAS, DEFAULT]);
                    }

                    return next(null);
                });
        },

        // get the api-key-alias, if not set already
        (next) => {
            if (options.alias) {
                return next(null);
            }

            return getData(ALIAS, { type: 'text' }, next);
        },

        // delete the existing data about the alias(if any) with user consent
        (next) => {
            let previousData = _.has(fileData, 'login._profiles') &&
                _.filter(fileData.login._profiles, [ALIAS, options.alias]);

            if (_.isEmpty(previousData)) {
                return next(null);
            }

            return getData(OVERRIDE_PERMISSION, { type: 'toggle', boolean: true, initial: true }, () => {
                if (!options.overridePermission) {
                    console.error(ABORT_MESSAGE);
                    process.exit(1);
                }

                // delete the old data related to the alias
                fileData.login._profiles = _.reject(fileData.login._profiles, [ALIAS, options.alias]);

                return next(null);
            });
        },

        // get the postman-api-key
        (next) => {
            return getData(POSTMAN_API_KEY, { type: 'text' }, (err) => {
                if (err) { return next(err); }

                // validate the API Key format
                if (!V1_API_KEY_REGEX.test(options.postmanApiKey) && !V2_API_KEY_REGEX.test(options.postmanApiKey)) {
                    return next(INVALID_API_KEY);
                }

                return next(null);
            });
        },

        // get the `encrypted` option
        (next) => { return getData(ENCRYPTED, { type: 'toggle', boolean: true, initial: false }, next); },

        // get the passkey if the user had choosen to use one
        (next) => {
            if (!options.encrypted) { return next(null); }

            return getData(PASSKEY, { type: 'password' }, next);
        },

        // encrypt/encode the API-Key and push the necessary fields into the `fileData`
        (next) => {
            // encrypt or encode the API Key
            options.postmanApiKey = options.encrypted ?
                crypt.encrypt(options.postmanApiKey, options.passkey) : crypt.encode(options.postmanApiKey);

            // format the user data and push it into the array
            !fileData.login && (fileData.login = {});
            !fileData.login._profiles && (fileData.login._profiles = []);
            fileData.login._profiles.push(_.pick(options, [ALIAS, POSTMAN_API_KEY, ENCRYPTED]));

            return next(null, fileData);
        },

        // update the data in the config file
        rcfile.store

    ], callback);
};
