var _ = require('lodash'),
    async = require('async'),
    transformer = require('postman-collection-transformer'),
    Collection = require('postman-collection').Collection,
    parseJson = require('parse-json'),
    parseCsv = require('csv-parse'),
    util = require('../util'),
    config = require('../config'),

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
        }) : cb(null, location);
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
                    return callback(new Error('newman: collection could not be loaded'));
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

            if (!_.isString(value)) { return done(null, value); }

            externalLoader('collection', value, function (err, data) {
                if (err) {
                    return done(err);
                }
                if (_.isObject(data) && !_.get(data, 'info.schema')) {
                    return transformer.convert(data, { inputVersion: '1.0.0', outputVersion: '2.0.0' }, done);
                }
                done(null, data);
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
