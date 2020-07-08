const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    readline = require('readline'),
    Writable = require('stream').Writable,
    rcfile = require('../config/rc-file'),
    util = require('../util'),
    crypt = require('../crypt'),
    print = require('../print'),
    colors = require('colors/safe'),

    ALIAS = 'alias',
    OVERRIDE_PERMISSION = 'overridePermission',
    POSTMAN_API_KEY = 'postmanApiKey',
    ENCRYPTED = 'encrypted',
    PASSKEY = 'passkey',

    INPUT_PROMPTS = {
        alias: 'Alias: (default) ',
        overridePermission: 'The alias already exists.\nDo you want to override it? (Y/N): ',
        postmanApiKey: 'Postman API-Key: ',
        encrypted: 'Do you want to have a passkey for authentication? (Y/N): ',
        passkey: 'Passkey: '
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
    // Create a new stream to facilitate hiding of user input
    let inputStream = new Writable({
            write (chunk, _encoding, callback) {
                if (!this.muted) {
                    print(chunk.toString());
                }
                // else only print a newline, if any
                else if (chunk.includes('\n')) {
                    print('\n');
                }

                callback();
            }
        }),
        rl = readline.createInterface({
            input: process.stdin,
            output: inputStream,
            terminal: true
        }),
        options = {},
        fileData,

        /**
         * Prompts the user for input, gets the same and stores it in the required field under `options`
         *
         * @param {String} field - The field to be asked for to the user
         * @param {Object} [opts] - Options related to the input field
         * @param {Boolean} opts.boolean - Indicates if the input field is boolean
         * @param {Boolean} opts.mutedInput - Indicates if the user input for the field is to be muted
         * @param {String} opts.default - Default value of the field, if any
         * @param {Function} cb - The callback to be invoked after storing the input
         */
        getData = (field, opts, cb) => {
            if (!cb && _.isFunction(opts)) {
                cb = opts;
                opts = {};
            }

            print(colors.yellow.bold(INPUT_PROMPTS[field]));
            inputStream.muted = Boolean(opts.mutedInput); // mute the input-stream if required

            rl.once('line', (answer) => {
                inputStream.muted = true; // make sure the writable is not muted

                !answer && (answer = opts.default);

                if (opts.boolean) {
                    answer.toLowerCase() === 'y' && (_.set(options, field, true));
                    answer.toLowerCase() === 'n' && (_.set(options, field, false));
                }
                else {
                    _.set(options, field, answer);
                }

                // exit the program if the user-input was invalid
                if (_.isUndefined(options[field])) {
                    console.error(INVALID_INPUT);
                    process.exit(1);
                }

                cb();
            });
            util.signal(field); // signal the parent process(if any) for input
        };

    waterfall([
        // get the data from home-rc-file
        // this is done in the beginning to prevent errors caused by file-load in between the login-process
        rcfile.load,

        // get the api-key-alias
        (data, next) => {
            fileData = data; // store the file-data for future use

            return getData(ALIAS, { default: 'default' }, next);
        },

        // delete the existing data about the alias(if any) with user consent
        (next) => {
            let previousData;

            _.has(fileData, 'login._profiles') &&
                (previousData = _.filter(fileData.login._profiles, [ALIAS, options.alias]));

            if (_.isEmpty(previousData)) {
                return next(null);
            }

            return getData(OVERRIDE_PERMISSION, { boolean: true }, () => {
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
        (next) => { return getData(POSTMAN_API_KEY, next); },

        // get the `encrypted` option
        (next) => { return getData(ENCRYPTED, { boolean: true }, next); },

        // get the passkey if the user had choosen to use one
        (next) => {
            if (!options.encrypted) { return next(null); }

            return getData(PASSKEY, { mutedInput: true }, next);
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
        inputStream.end();
        rl.close();

        if (err) {
            return callback(err);
        }

        console.info(SUCCESS_MESSAGE);

        return callback(null);
    });
};
