var fs = require('fs'),
    _ = require('lodash'),
    E = '';

/**
 * Module whose job is to export a file which is in an export format.
 *
 * @param {Object} options
 * @param {String} path
 * @param {String|Object} content
 * @param {Function} done
 */
module.exports = function (options, done) {
    if (!_.isString(options.path)) { return done(); } // export only if valid path
    fs.writeFile(options.path, _.isPlainObject(options.content) ? JSON.stringify(options.content, 0, 2) :
        (options.content || E), done);
};
