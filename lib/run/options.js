var _ = require('lodash'),
    fs = require('fs'),
    async = require('async'),
    Collection = require('postman-collection').Collection,
    VariableScope = require('postman-collection').VariableScope,
    transformer = require('postman-collection-transformer'),
    liquidJSON = require('liquid-json'),
    parseCsv = require('csv-parse'),
    PostmanResource = require('../api').PostmanResource,
    util = require('../util'),

    /**
     * The message displayed when the specified collection file can't be loaded.
     *
     * @const
     * @type {String}
     */
    COLLECTION_LOAD_ERROR_MESSAGE = 'collection could not be loaded',

    /**
     * The message displayed when the specified iteration data file can't be loaded.
     *
     * @const
     * @type {String}
     */
    ITERATION_DATA_LOAD_ERROR_MESSAGE = 'iteration data could not be loaded',

    /**
     * The message displayed when the specified environment or globals file can't be loaded.
     *
     * @const
     * @type {String}
     */
    LOAD_ERROR_MESSAGE = 'could not load ',

    /**
     * The set of postman collection transformer options, to convert collection v1 to collection v2.
     *
     * @const
     * @type {Object}
     */
    COLLECTION_TRANSFORMER_OPTION = { inputVersion: '1.0.0', outputVersion: '2.1.0' },

    /**
     * Initialises a set of PostmanResource instances corresponding to all the options which represents one
     *
     * @param {Object} options - Set of run options
     * @param {Function} callback - The function to be invoked after process
     * @returns {*}
     */
    createPostmanResources = function (options, callback) {
        return async.mapValuesSeries(_.pick(options, ['collection', 'environment']), (value, type, cb) => {
            // if the option doesn't represent a postman-resource, ignore it
            if (!util.isPostmanResource(value)) {
                return cb(null);
            }

            // if the option has an api-key as a query-param, use that api-key to communicate with Postman
            if ((/https?.*apikey=.*/).test(value)) {
                let urlObj = new URL(value),
                    apikey = urlObj.searchParams.get('apikey');

                urlObj.searchParams.delete('apikey'); // delete the query-param for security concerns

                return cb(null, new PostmanResource(type, urlObj.href, apikey));
            }

            // use the session-api-key in other cases
            return util.extractPostmanApiKey(options.postmanApiKey, (err, apikey) => {
                if (err) { return cb(err); }

                options.postmanApiKey = apikey; // store the loaded apikey

                return cb(null, new PostmanResource(type, value, apikey));
            });
        }, callback);
    },

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
     * @param {String|PostmanResource} location - The location to load from (file path/URL/PostmanResource instance).
     * @param {function} cb - The callback function whose invocation marks the end of the external load routine.
     * @returns {*}
     */
    externalLoader = function (type, location, cb) {
        if (location instanceof PostmanResource) {
            return location.get(cb);
        }

        return _.isString(location) ? util.fetchJson(location, type, function (err, data) {
            if (err) {
                return cb(err);
            }

            return cb(null, extractModel(data, type));
        }) : cb(null, extractModel(location, type));
    },

    /**
     * A helper method to process a collection and convert it to a V2 equivalent if necessary, and return it.
     *
     * @todo Drop support for the v1 collection format in Newman v5.
     * Reference: https://github.com/postmanlabs/newman/pull/1660
     *
     * @param {Object} collection The input collection, specified as a JSON object.
     * @param {Function} callback A handler function that consumes an error object and the processed collection.
     * @returns {*}
     */
    processCollection = function (collection, callback) {
        if (util.isV1Collection(collection)) {
            // @todo: route this via print module to respect silent flags
            console.warn('newman: Newman v4 deprecates support for the v1 collection format');
            console.warn('  Use the Postman Native app to export collections in the v2 format\n');

            return transformer.convert(collection, COLLECTION_TRANSFORMER_OPTION, callback);
        }

        callback(null, collection);
    },

    /**
     * Helper function that manages the load of environments and globals
     *
     * @private
     * @param {String} type - The type of resource to load: collection, environment, etc.
     * @param {String|Object|PostmanResource} value - The value of the resource.
     * @param {Function} callback - The function invoked when the scope has been loaded.
     */
    loadScopes = function (type, value, callback) {
        var done = function (err, scope) {
            if (err) { return callback(new Error(LOAD_ERROR_MESSAGE + `${type}\n  ${err.message || err}`)); }

            if (!_.isObject(scope)) {
                return done(new Error(LOAD_ERROR_MESSAGE + type));
            }

            callback(null, new VariableScope(VariableScope.isVariableScope(scope) ? scope.toJSON() : scope));
        };

        // if the value represents a location to be fetched from, load it from the same
        if (_.isString(value) || value instanceof PostmanResource) {
            return externalLoader(type, value, done);
        }

        return done(null, value);
    },

    /**
     * Custom method to auto parse CSV values
     *
     * @private
     * @param {String} value - CSV field value
     * @param {Object} context - Context of field value
     * @param {Boolean} context.quoting - A boolean indicating if the field was surrounded by quotes.
     * @returns {String|Number|Date}
     */
    csvAutoParse = function (value, context) {
        if (context.quoting) {
            // avoid parsing quoted values
            return value;
        }

        if (util.isInt(value)) {
            return parseInt(value, 10);
        }

        if (util.isFloat(value)) {
            return parseFloat(value);
        }

        return value;
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
         * @param {Object|String|PostmanResource} value - The value of the collection (JSON/location/PostmanResource)
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

            // if the collection represents a location, fetch it from the same
            if (_.isString(value) || value instanceof PostmanResource) {
                return externalLoader('collection', value, function (err, data) {
                    if (err) {
                        return done(new Error(COLLECTION_LOAD_ERROR_MESSAGE +
                        (err.help ? `\n  ${err.help}` : '') +
                        `\n  ${err.message || err}`));
                    }
                    if (!_.isObject(data)) {
                        return done(new Error(COLLECTION_LOAD_ERROR_MESSAGE));
                    }

                    return processCollection(data, done);
                });
            }

            // if the collection is an object, convert it to V2 if necessary and return the result
            return processCollection(value, done);
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
         * Helper function to sanitize folder option.
         *
         * @param {String[]|String} value - The list of folders to execute
         * @param {Function} callback - The callback function invoked to mark the end of the folder load routine.
         * @returns {*}
         */
        folder: function (value, callback) {
            if (!value.length) {
                return callback(); // avoids empty string or array
            }

            if (Array.isArray(value) && value.length === 1) {
                return callback(null, value[0]); // avoids using multipleIdOrName strategy for a single item array
            }

            callback(null, value);
        },

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
                    return callback(new Error(ITERATION_DATA_LOAD_ERROR_MESSAGE + `\n  ${err.message || err}`));
                }

                // Try loading as a JSON, fall-back to CSV. @todo: switch to file extension based loading.
                async.waterfall([
                    (cb) => {
                        try {
                            return cb(null, liquidJSON.parse(data.trim()));
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
                        parseCsv(data, {
                            columns: true, // infer the columns names from the first row
                            escape: '"', // escape character
                            cast: csvAutoParse, // function to cast values of individual fields
                            trim: true, // ignore whitespace immediately around the delimiter
                            relax: true, // allow using quotes without escaping inside unquoted string
                            relax_column_count: true, // ignore inconsistent columns count
                            bom: true // strip the byte order mark (BOM) from the input string
                        }, cb);
                    }
                ], (err, parsed) => {
                    if (err) {
                        return callback(new Error(ITERATION_DATA_LOAD_ERROR_MESSAGE + `\n ${err.message || err}`));
                    }

                    callback(null, parsed);
                });
            });
        },

        sslClientCertList: function (location, callback) {
            if (Array.isArray(location)) {
                return callback(null, location);
            }

            if (typeof location !== 'string') {
                return callback(new Error('path for ssl client certificates list file must be a string'));
            }

            fs.readFile(location, function (err, value) {
                if (err) {
                    return callback(new Error(`unable to read the ssl client certificates file "${location}"`));
                }

                try {
                    value = liquidJSON.parse(value.toString(util.detectEncoding(value)).trim());
                }
                catch (e) {
                    return callback(new Error(`the file at ${location} does not contain valid JSON data.`));
                }

                // ensure that `sslClientCertList` is an array
                if (!Array.isArray(value)) {
                    return callback(new Error('expected ssl client certificates list to be an array.'));
                }

                return callback(null, value);
            });
        }
    };

/**
 * The helper function to load all file/cloud-API based information for the current collection run.
 *
 * @param {Object} options - The set of generic collection run options.
 * @param {Function} callback - The function called to mark the completion of the configuration load routine.
 * @returns {*}
 */
module.exports = function (options, callback) {
    // set newman version used for collection run
    options.newmanVersion = util.version;

    // set working directory if not provided
    options.workingDir = options.workingDir || process.cwd();

    // allow insecure file read by default
    options.insecureFileRead = Boolean(_.get(options, 'insecureFileRead', true));

    // sanitize environment and globals
    !options.environment && (options.environment = {});
    !options.globals && (options.globals = {});

    let postmanResources = {};

    async.waterfall([
        // get PostmanResource instances corresponding to each option which represents a postman-resource
        (next) => {
            return createPostmanResources(options, next);
        },

        (_postmanResources, next) => {
            postmanResources = _postmanResources; // store these for future use

            // modify the value of options which represent a postman-resource to corresponding PostmanResource instance
            _.forEach(postmanResources, (postmanResource, type) => {
                postmanResource && (options[type] = postmanResource);
            });

            // finally, load the options from the loaders
            return async.mapValues(options, (value, name, cb) => {
                if (value && _.isFunction(configLoaders[name])) {
                    return configLoaders[name](value, cb);
                }

                return cb(null, value);
            }, next);
        }

    ], (err, result) => {
        if (err) { return callback(err); }

        // mutate globals to add global variables passed from CLI
        !_.isEmpty(options.globalVar) && _.forEach(options.globalVar, function (variable) {
            variable && (result.globals.set(variable.key, variable.value));
        });

        // mutate environment to add env-variables passed from CLI
        !_.isEmpty(options.envVar) && _.forEach(options.envVar, function (variable) {
            variable && (result.environment.set(variable.key, variable.value));
        });

        return callback(null, result, postmanResources);
    });
};
