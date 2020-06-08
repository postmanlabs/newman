const _ = require('lodash'),
    waterfall = require('async/waterfall'),
    readline = require('readline'),
    Writable = require('stream').Writable,
    rcfile = require('../config/rc-file'),
    crypt = require('../crypt'),

    ALIAS = 'alias',
    POSTMAN_API_KEY = 'postmanApiKey',
    ENCRYPTED = 'encrypted',
    PASSKEY = 'passkey',
    OVERRIDE_PERMISSION = 'overridePermission',

    SUCCESS_MESSAGE = 'User added successfully.',
    FAILURE_MESSAGE = 'Operation unsuccessful',

    USER_OVERRIDE_WARNING = 'The user already exists.\nDo you want to override it (Y/N): ',
    API_KEY_INPUT_PROMPT = 'Enter the Postman API Key of the user: ',
    PASSKEY_INPUT_PROMPT = 'Enter the passkey: ',

    /**
     * Sends a message to the parent process if it is listening.
     * Used for testing using child process module
     *
     * @param {String} message - The message
     * @returns {*}
     */
    signal = (message) => { process.send && process.send(message); };

/**
 * Gets the details of the user from interaction and writes it in the config file
 * located in HOME_DIR/.postman/newmanrc. If the file is not available, creates them.
 *
 * @param {Object} userData - Data related to the new user.
 * @param {String} userData.alias - Name of the user for local reference
 * @param {Boolean} [userData.passkey] - If set to true, the function gets the key
 * to encryption from the interactive shell and stores the encrypted API Key
 * @param {Function} [callback] - The callback function to be invoked to mark the end of the function.
 * @returns {*}
 */
module.exports = (userData, callback) => {
    // Override the write function to facilitate hiding key
    let mutableStdout = new Writable({
            write (chunk, encoding, callback) {
                if (!this.muted) { process.stdout.write(chunk, encoding); }
                callback();
            }
        }),
        rl = readline.createInterface({
            input: process.stdin,
            output: mutableStdout,
            terminal: true
        });

    !_.isFunction(callback) && (callback = _.noop);

    waterfall([
        rcfile.loadHome,
        (fileData, next) => {
            // get the data related to the user if it already exists
            let previousData = fileData.login && _.filter(fileData.login._profiles, [ALIAS, userData.alias]);

            if (_.isEmpty(previousData)) {
                return next(null, fileData);
            }

            // if the user related data already exists, get the user permission to override it
            rl.question(USER_OVERRIDE_WARNING, (answer) => {
                // to be safe, continue only if the answer is 'Y' or 'y'
                if (!(answer === 'Y' || answer === 'y')) {
                    console.error(FAILURE_MESSAGE);
                    process.exit(1);
                }

                // delete the old user data
                fileData.login._profiles = _.reject(fileData.login._profiles, [ALIAS, userData.alias]);

                return next(null, fileData);
            });
            signal(OVERRIDE_PERMISSION);
        },
        (fileData, next) => {
            rl.question(API_KEY_INPUT_PROMPT, (answer) => {
                userData.postmanApiKey = answer;

                return next(null, fileData);
            });
            signal(POSTMAN_API_KEY);
        },
        (fileData, next) => {
            // ask for the passkey only if the option is selected
            if (!userData.passkey) { return next(null, fileData); }

            rl.question(PASSKEY_INPUT_PROMPT, (answer) => {
                userData.passkey = answer;
                mutableStdout.muted = false; // resume the stdout output
                mutableStdout.write('\n'); // go to next line after the user input

                return next(null, fileData);
            });
            mutableStdout.muted = true; // hide the user input as soon as the prompt is shown
            signal(PASSKEY);
        },
        (fileData, next) => {
            // encrypt or encode the API Key
            userData.postmanApiKey = userData.passkey ?
                crypt.encrypt(userData.postmanApiKey, userData.passkey) : crypt.encode(userData.postmanApiKey);

            // format the user data and push it in into the array
            !fileData.login && (fileData.login = {});
            !fileData.login._profiles && (fileData.login._profiles = []);
            userData.passkey && (userData.encrypted = true);
            fileData.login._profiles.push(_.pick(userData, [ALIAS, POSTMAN_API_KEY, ENCRYPTED]));

            return next(null, fileData);
        },
        rcfile.storeHome // update the data in the config file
    ], (err) => {
        rl.close();
        if (err) {
            return callback(err);
        }

        console.info(SUCCESS_MESSAGE);

        return callback(null);
    });
};
