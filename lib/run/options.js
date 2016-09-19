var _ = require('lodash'),
    async = require('async'),
    transformer = require('postman-collection-transformer'),
    Collection = require('postman-collection').Collection,
    parseJson = require('parse-json'),
    parseCsv = require('csv-parse'),
    util = require('../util'),
    config = require('../config'),

    COLLECTION_LOAD_ERROR_MESSAGE = 'newman: collection could not be loaded',
    COLLECTION_TRANSFORMER_OPTION = { inputVersion: '1.0.0', outputVersion: '2.0.0' },

    /**
     * Accepts an object, and extracts the property inside an object which is supposed to contain the required data.
     * In case of variables, it also extracts them into plain JS objects.
     *
     * @param {Object} source
     * @param {String} type - "environment" or "globals", etc
     *
     * @returns {Object}
     */
    extractModel = function (source, type) {
        source = source[type] || source; // extract object that holds variable. these usually come from cloud API
        if (!_.isObject(source)) {
            return undefined;
        }

        // ensure we un-box the JSON if it comes from cloud-api or similar sources
        !source.values && _.isObject(source[type]) && (source = source[type]);

        // ensure we handle environment sent in form of array of values
        (source.name && _.isArray(source.values)) && (source = source.values);

        // we ensure that environment passed as array is converted to plain object. runtime does this too, but we do it
        // here for consistency of options passed to reporters
        return _.isArray(source) ? _(source).keyBy('key').mapValues('value').value() : source;
    },

    /**
     * Loads the given data of type from a specified external location
     *
     * @param {String} type - The type of data to load.
     * @param {String} location - The location to load from (path or URL)
     * @param {function} cb
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
     * @param {Object} collection The input collection, specified as a JSON object
     * @param {Function} callback A handler function that consumes an error object and the processed collection
     * @returns {*|Function}
     */
    processCollection = function (collection, callback) {
        return transformer.isv1(collection) ? transformer.convert(collection, COLLECTION_TRANSFORMER_OPTION, callback) :
            callback(null, collection);
    },

    /**
     * Custom configuration loaders for the required configuration keys.
     *
     * @type {Object}
     */
    configLoaders = {
        collection: function (value, callback) {
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

        environment: externalLoader.bind(this, 'environment'),

        globals: externalLoader.bind(this, 'globals'),

        iterationData: function (location, callback) {
            util.fetch(location, function (err, data) {
                if (err) {
                    return callback(err);
                }

                // Try loading as a JSON, fallback to CSV.
                async.waterfall([
                    (cb) => {
                        try {
                            return cb(null, parseJson(data));
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
                        parseCsv(data, { columns: true }, cb);
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

module.exports = function (options, callback) {
    config.get(options, { loaders: configLoaders, command: 'run' }, callback);
};
