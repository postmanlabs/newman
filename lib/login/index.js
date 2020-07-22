const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    prompts = require('prompts'),
    rcfile = require('../config/rc-file'),
    util = require('../util'),
    crypt = require('../crypt'),

    ALIAS = 'alias',
    OVERRIDE_PERMISSION = 'overridePermission',
    POSTMAN_API_KEY = 'postmanApiKey',
    ENCRYPTED = 'encrypted',
    PASSKEY = 'passkey',

    INPUT_PROMPTS = {
        alias: 'Alias',
        overridePermission: 'The alias already exists.\nDo you want to override it?',
        postmanApiKey: 'Postman API-Key',
        encrypted: 'Do you want to have a passkey for authentication?',
        passkey: 'Passkey'
    },

    SUCCESS_MESSAGE = 'API-Key added successfully.',
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
         * @param {String} opts.initial - Default value of the field, if any
         * @param {Function} cb - The callback to be invoked after storing the input
         */
        getData = async (field, opts, cb) => {
            let promptOptions = {
                type: opts.type,
                name: 'response',
                message: INPUT_PROMPTS[field]
            };

            if (opts.boolean) {
                promptOptions = {
                    ...promptOptions,
                    active: 'Yes',
                    inactive: 'No'
                };
            }

            opts.initial && (promptOptions.initial = opts.initial);

            util.signal(field); // signal the parent process(if any) for input
            const { response } = await prompts(promptOptions);

            _.set(options, field, response);

            // exit the program if the user-input was empty
            if (_.isUndefined(options[field])) {
                console.error(INVALID_INPUT);
                process.exit(1);
            }

            cb();
        };

    waterfall([
        // get the data from home-rc-file
        // this is done in the beginning to prevent errors caused by file-load in between the login-process
        rcfile.load,

        // get the api-key-alias
        (data, next) => {
            fileData = data; // store the file-data for future use

            return getData(ALIAS, { type: 'text', initial: 'default' }, next);
        },

        // delete the existing data about the alias(if any) with user consent
        (next) => {
            let previousData;

            _.has(fileData, 'login._profiles') &&
                (previousData = _.filter(fileData.login._profiles, [ALIAS, options.alias]));

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
        (next) => { return getData(POSTMAN_API_KEY, { type: 'text' }, next); },

        // get the `encrypted` option
        (next) => { return getData(ENCRYPTED, { type: 'toggle', boolean: true, initial: false }, next); },

        // get the passkey if the user had choosen to use one
        (next) => {
            if (!options.encrypted) { return next(null); }

            return getData(PASSKEY, { type: 'invisible' }, next);
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

    ], (err) => {
        if (err) {
            return callback(err);
        }

        console.info(SUCCESS_MESSAGE);

        return callback(null);
    });
};
