/* eslint-disable no-process-env */
var _ = require('lodash'),
    fs = require('fs'),
    join = require('path').join,
    async = require('async'),
    util = require('../util'),
    liquidJSON = require('liquid-json'),

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
    FILE_NAME = 'newmanrc';

/**
 * Configuration loader to acquire run settings from a file present in the home directory: POSTMAN_CONFIG_DIR/FILE_NAME.
 *
 * @param {Function} callback - The callback function invoked to mark the completion of the config loading routine.
 * @returns {*}
 */
module.exports.load = (callback) => {
    var iswin = (/^win/).test(process.platform),
        home = iswin ? process.env.USERPROFILE : process.env.HOME,

        configFiles = [];

    configFiles.push(join(process.cwd(), '.' + FILE_NAME));
    home && configFiles.push(join(home, '.' + POSTMAN_CONFIG_DIR, FILE_NAME));
    !iswin && configFiles.push(join('/etc', POSTMAN_CONFIG_DIR, FILE_NAME));

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
                return cb(_.set(e, 'help', `The file at ${path} contains invalid data.`));
            }
        });
    }, (err, files) => {
        if (err) {
            return callback(err);
        }

        return callback(null, _.merge.apply(this, files));
    });
};
