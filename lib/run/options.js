var _ = require('lodash'),
    async = require('async'),
    transformer = require('postman-collection-transformer'),
    Collection = require('postman-collection').Collection,
    VariableScope = require('postman-collection').VariableScope,
    parseJson = require('parse-json'),
    parseCsv = require('csv-parse'),
    util = require('../util'),
    config = require('../config'),

    /**
     * The message displayed when the specified collection file can't be loaded.
     *
     * @const
     * @type {String}
     */
    COLLECTION_LOAD_ERROR_MESSAGE = 'newman: collection could not be loaded',

    /**
     * The message displayed when the specified environment or globals file can't be loaded.
     *
     * @const
     * @type {String}
     */
    LOAD_ERROR_MESSAGE = 'newman: could not load ',

    /**
     * The set of postman collection transformer options, to convert collection v1 to collection v2.
     *
     * @const
     * @type {Object}
     */
    COLLECTION_TRANSFORMER_OPTION = { inputVersion: '1.0.0', outputVersion: '2.1.0' },

    /**
     * Accepts an object, and extracts the property inside an object which is supposed to contain the required data.
     * In case of variables, it also extracts them into plain JS objects.
     *
     * @param {Object} source - The source wrapper object that may or may not contain inner wrapped properties.
     * @param {String} type - "environment" or "globals", etc.
     * @returns {Object} - The object representation of the current extracted property.
     */
    extractModel = function (source, type) {
        source = source[type] || source; // extract object that holds variable. these usually come from cloud API
        if (!_.isObject(source)) {
            return undefined;
        }

        // ensure we un-box the JSON if it comes from cloud-api or similar sources
        !source.values && _.isObject(source[type]) && (source = source[type]);

        // we ensure that environment passed as array is converted to plain object. runtime does this too, but we do it
        // here for consistency of options passed to reporters
        return source;
    },

    /**
     * Loads the given data of type from a specified external location
     *
     * @param {String} type - The type of data to load.
     * @param {String} location - The location to load from (file path or URL).
     * @param {function} cb - The callback function whose invocation marks the end of the external load routine.
     * @returns {*}
     */
    externalLoader = function (type, location, cb) {
        return _.isString(location) ? util.fetchJson(location, function (err, data) {
            if (err) {
                return cb(err);
            }
            return cb(null, extractModel(data, type));
        }) : cb(null, extractModel(location, type));
    },

    /**
     * A helper method to process a collection and convert it to a V2 equivalent if necessary, and return it.
     *
     * @param {Object} collection The input collection, specified as a JSON object.
     * @param {Function} callback A handler function that consumes an error object and the processed collection.
     * @returns {*|Function} -
     */
    processCollection = function (collection, callback) {
        return transformer.isv1(collection) ? transformer.convert(collection, COLLECTION_TRANSFORMER_OPTION, callback) :
            callback(null, collection);
    },

    /**
     * Helper function that manages the load of environments and globals
     *
     * @private
     * @param {String} type - The type of resource to load: collection, environment, etc.
     * @param {String|Object} value - The value derived from the CLI or run command.
     * @param {Function} callback - The function invoked when the scope has been loaded.
     */
    loadScopes = function (type, value, callback) {
        var done = function (err, scope) {
            if (err) { return callback(err); }

            if (!_.isObject(scope)) {
                return done(new Error(LOAD_ERROR_MESSAGE + type));
            }

            callback(null, new VariableScope(VariableScope.isVariableScope(scope) ? scope.toJSON() : scope));
        };

        if (_.isObject(value)) {
            return done(null, value);
        }

        externalLoader(type, value, done);
    },

    /**
     * Custom configuration loaders for the required configuration keys.
     *
     * @type {Object}
     */
    configLoaders = {

        /**
         * The collection file load helper for the current run.
         *
         * @param {Object|String} value - The collection, specified as a JSON object, or the path to it's file.
         * @param {Function} callback - The callback function invoked to mark the end of the collection load routine.
         * @returns {*}
         */
        collection: function (value, callback) {

            /**
             * The post collection load handler.
             *
             * @param {?Error} err - An Error instance / null, passed from the collection loader.
             * @param {Object} collection - The collection / raw JSON object, passed from the collection loader.
             * @returns {*}
             */
            var done = function (err, collection) {
                if (err) {
                    return callback(err);
                }

                // ensure that the collection option is present before starting a run
                if (!_.isObject(collection)) {
                    return callback(new Error(COLLECTION_LOAD_ERROR_MESSAGE));
                }

                // ensure that the collection reference is an SDK instance
                // @todo - should this be handled by config loaders?
                collection = new Collection(Collection.isCollection(collection) ?
                    // if the option contain an instance of collection, we simply clone it for future use
                    // create a collection in case it is not one. user can send v2 JSON as a source and that will be
                    // converted to a collection
                    collection.toJSON() : collection);

                callback(null, collection);
            };

            // if the collection has been specified as an object, convert to V2 if necessary and return the result
            if (_.isObject(value)) {
                return processCollection(value, done);
            }

            externalLoader('collection', value, function (err, data) {
                if (err) {
                    return done(err);
                }
                if (!_.isObject(data)) {
                    return done(new Error(COLLECTION_LOAD_ERROR_MESSAGE));
                }
                return processCollection(data, done);
            });
        },

        /**
         * The environment configuration object, loaded for the current collection run.
         *
         * @type {Object}
         */
        environment: loadScopes.bind(this, 'environment'),

        /**
         * The object of globals, loaded for the collection run.
         *
         * @type {Object}
         */
        globals: loadScopes.bind(this, 'globals'),

        /**
         * The iterationData loader module, with support for JSON or CSV data files.
         *
         * @param {String|Object[]} location - The path to the iteration data file for the current collection run, or
         * the array of iteration data objects.
         * @param {Function} callback - The function invoked to indicate the end of the iteration data loading routine.
         * @returns {*}
         */
        iterationData: function (location, callback) {
            if (_.isArray(location)) { return callback(null, location); }

            util.fetch(location, function (err, data) {
                if (err) {
                    return callback(err);
                }

                // Try loading as a JSON, fall-back to CSV. @todo: switch to file extension based loading.
                async.waterfall([
                    (cb) => {
                        try {
                            return cb(null, parseJson(data.trim()));
                        }
                        catch (e) {
                            return cb(null, undefined); // e masked to avoid displaying JSON parse errors for CSV files
                        }
                    },
                    (json, cb) => {
                        if (json) {
                            return cb(null, json);
                        }
                        // Wasn't JSON
                        parseCsv(data, { columns: true, escape: '\\', auto_parse: true, trim: true }, cb);
                    }
                ], (err, parsed) => {
                    if (err) {
                        // todo: Log meaningful stuff here
                        return callback(err);
                    }

                    callback(null, parsed);
                });
            });
        }
    };

/**
 * The helper function to load all file based information for the current collection run.
 *
 * @param {Object} options - The set of generic collection run options.
 * @param {Function} callback - The function called to mark the completion of the configuration load routine.
 * @returns {*}
 */
module.exports = function (options, callback) {
    config.get(options, { loaders: configLoaders, command: 'run' }, function (err, result) {
        if (err) { return callback(err); }

        !_.isEmpty(options.globalVar) && _.forEach(options.globalVar, function (variable) {
            variable && (result.globals.set(variable.key, variable.value));
        });

        callback(null, result);
    });
};
