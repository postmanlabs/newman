/* eslint-disable no-process-env */
var _ = require('lodash'),
    fs = require('fs'),
    join = require('path').join,
    async = require('async'),
    util = require('../util'),
    liquidJSON = require('liquid-json'),
    os = require('os'),
    shell = require('shelljs'),

    /**
     * Name of the directory that contains the file denoted by FILE_NAME.
     *
     * @type {String}
     */
    POSTMAN_CONFIG_DIR = 'postman',

    /**
     * Name of the file that contains Newman compliant confguration information.
     *
     * @type {String}
     */
    FILE_NAME = 'newmanrc',

    // List of config files across the system
    SYSTEM_CONFIG_FILE = (/^win/).test(process.platform) && join('/etc', POSTMAN_CONFIG_DIR, FILE_NAME),
    USER_CONFIG_FILE = join(os.homedir(), '.' + POSTMAN_CONFIG_DIR, FILE_NAME),
    PROJECT_CONFIG_FILE = join(process.cwd(), '.' + FILE_NAME),

    // List of possible error messages
    HOME_DIR_NOT_FOUND = 'Couldn\'t find the user home directory for storing the config file',
    FILE_CREATE_ERROR = (file) => { return `Couldn't create the config file at ${file}`; },
    INVALID_DATA_ERROR = (file) => { return `The config file at ${file} contains invalid data.`; },
    FILE_WRITE_ERROR = (file) => { return `Couldn't write into the config file at ${file}`; };


module.exports = {
    /**
     * Configuration loader to acquire settings from all the config files from across the system.
     *
     * @param {Function} callback - The callback function invoked to mark the completion of the config loading routine.
     * @returns {*}
     */
    loadAll: (callback) => {
        var configFiles = [];

        SYSTEM_CONFIG_FILE && configFiles.push(SYSTEM_CONFIG_FILE);
        USER_CONFIG_FILE && configFiles.push(USER_CONFIG_FILE);
        configFiles.push(PROJECT_CONFIG_FILE);

        async.mapSeries(configFiles, (path, cb) => {
            fs.readFile(path, (err, data) => {
                if (err) {
                    return cb(null, {}); // err masked to avoid overpopulating terminal with missing .newmanrc messages
                }
                data && data.toString && (data = data.toString(util.detectEncoding(data)).trim());
                try {
                    return cb(null, liquidJSON.parse(data));
                }
                catch (e) {
                    return cb(new Error(INVALID_DATA_ERROR(path)));
                }
            });
        }, (err, files) => {
            if (err) {
                return callback(err);
            }

            return callback(null, _.merge.apply(this, files));
        });
    },

    /**
     * Configuration loader to acquire settings from the config file located in HOME_DIR.
     *
     * @param {Function} callback - The callback function invoked to mark the completion of the config loading routine.
     * @returns {*}
     */
    loadHome: (callback) => {
        if (!USER_CONFIG_FILE) {
            return callback(new Error(HOME_DIR_NOT_FOUND));
        }

        // if there is no existing rc file, return an empty object
        if (!shell.test('-f', USER_CONFIG_FILE)) {
            return callback(null, {});
        }

        fs.readFile(USER_CONFIG_FILE, (err, data) => {
            if (err) {
                return callback(err);
            }

            data && data.toString && (data = data.toString(util.detectEncoding(data)));

            try {
                data = liquidJSON.parse(data);
            }
            catch (e) {
                return callback(new Error(INVALID_DATA_ERROR(USER_CONFIG_FILE)));
            }

            return callback(null, data);
        });
    },

    /**
     * Updates the config file located in the HOME_DIR with the data passed.
     *
     * If it doesn't exist, creates a new file
     *
     * @param {Object} data - The config object to be stored in the file
     * @param {Function} callback - The callback which is invoked after the write.
     * @returns {*}
     */
    storeHome: (data, callback) => {
        let dir = join(os.homedir(), '.' + POSTMAN_CONFIG_DIR);

        try {
            // create a directory and the file if they don't exist
            !shell.test('-d', dir) && shell.mkdir('-p', dir);
            !shell.test('-f', USER_CONFIG_FILE) && shell.touch(USER_CONFIG_FILE) &&
                shell.chmod(600, USER_CONFIG_FILE);
        }
        catch (e) {
            return callback(new Error(FILE_CREATE_ERROR(USER_CONFIG_FILE)));
        }

        fs.writeFile(USER_CONFIG_FILE, JSON.stringify(data, null, 2),
            (err) => {
                if (err) { return callback(new Error(FILE_WRITE_ERROR(USER_CONFIG_FILE))); }

                return callback(null);
            });
    }
};
