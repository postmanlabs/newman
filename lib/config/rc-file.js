var _ = require('lodash'),
    fs = require('fs'),
    join = require('path').join,
    async = require('async'),
    parseJson = require('parse-json'),

    POSTMAN_CONFIG_DIR = 'postman',
    FILE_NAME = 'newmanrc';

/**
 *
 * @param callback
 */
module.exports.load = (callback) => {
    var iswin = (process.platform === 'win32'),
        home = iswin ? process.env.USERPROFILE : process.env.HOME,

        configFiles = [];

    configFiles.push(join(process.cwd(), '.' + FILE_NAME));
    home && configFiles.push(join(home, '.' + POSTMAN_CONFIG_DIR, FILE_NAME));
    !iswin && configFiles.push(join('/etc', POSTMAN_CONFIG_DIR, FILE_NAME));

    async.mapSeries(configFiles, (path, cb) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                return cb(null, {});
            }
            data && data.toString && (data = data.toString());
            try {
                return cb(null, parseJson(data));
            }
            catch (e) {
                return cb(e); // File exists but contains invalid data. That's a fatal error.
            }
        });
    }, (err, files) => {
        if (err) {
            return callback(err);
        }

        return callback(null, _.merge.apply(this, files));
    });
};
