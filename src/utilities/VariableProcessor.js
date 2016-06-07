var jsface = require('jsface'),
    Helpers = require('./Helpers'),
    uuid = require('node-uuid'),
    _lod = require("lodash"),
    Globals = require("./Globals"),
    _und = require('underscore');

/**
 * @name VariableProcessor
 * @namespace
 * @classdesc Helper singleton class that does the variable and environment processing for newman
 */
var VariableProcessor = jsface.Class({
    $singleton: true,

    // TODO: Make {{}} configurable
    $statics: {
        ENV_REGEX: /\{\{([a-z0-9\-._\s]+)\}\}/ig,

        FUNCTION_REGEX: /\{\{\$([a-z0-9\-._]+)\}\}/ig
    },

    // placeholders to define function variables
    getFunctionVariables: {
        guid: function () {
        },
        timestamp: _und.now(),
        randomInt: _und.random(0, 1000)
    },

    _resetFunctionVariables: function () {
        var guid = uuid.v4();
        var timestamp = Date.now();
        var randomInt = _und.random(0, 1000);
        this.getFunctionVariables.guid = guid;
        this.getFunctionVariables.randomInt = randomInt;
        this.getFunctionVariables.timestamp = timestamp;
    },

    // updates request url by the replacing it with pathVariables
    _processPathVariable: function (request) {
        if (typeof request.pathVariables !== undefined) {
            var sourceObject = request.pathVariables;
            // for each path variable - do a simple find replace
            _und.each(_und.keys(sourceObject), function (key) {
                var s = request.url;
                request.url = s.replace(":" + key, sourceObject[key]);
            }, this);
        }
    },

    // updates request properties by the replacing them with function variables
    _processFunctionVariable: function (request) {
        var properties = ["url", "headers", "form", "data", "helperAttributes"];

        request.transformed = request.transformed || {};

        _und.each(properties, function (prop) {
            // check if the prop exists
            if (request[prop] !== undefined) {
                if (typeof request[prop] === "string") {
                    // if string, use directly
                    request.transformed[prop] = this._findReplace(request[prop], this.getFunctionVariables, this.FUNCTION_REGEX);
                } else {
                    // if not string, stringify it
                    // findReplace, unstringify it and set it
                    var jsonifiedProp = JSON.stringify(request[prop]);
                    var parsedJsonProp = JSON.parse(this._findReplace(jsonifiedProp, this.getFunctionVariables, this.FUNCTION_REGEX));
                    request.transformed[prop] = parsedJsonProp;
                }
            }
        }, this);
    },

    // replaces a string based on keys in the sourceObject as matched by a regex. Supports recursive replacement
    // usage: _findReplace("{{url}}/blog/posts/{{id}}", {url: "http://localhost", id: 2}, this.ENV_REGEX)
    // Note: The regex provided should capture the key to be replaced (use parenthesis)
    _findReplace: function (stringSource, sourceObject, REGEX, recurseCount) {
        if (typeof recurseCount === "undefined") {
            recurseCount = 1;
        }
        //console.log("Limit: " + Globals.recurseLimit);
        if (recurseCount > Globals.recurseLimit) {
            return stringSource;
        }

        function getKey(match, key) {
            var fromSource = sourceObject[key];
            if (typeof fromSource === "undefined") {
                return "{{" + key + "}}";
            }
            return fromSource;
        }

        var oldString = stringSource + "";
        stringSource = stringSource.replace(REGEX, getKey);

        if (oldString === stringSource) {
            return stringSource;
        }

        if (stringSource.match(REGEX)) {
            return this._findReplace(stringSource, sourceObject, REGEX, recurseCount + 1);
        }
        return stringSource;
    },

    // transforms the request as per the environment json data passed
    _processEnvVariable: function (request, envJson) {
        var kvpairs = envJson.values;
        var oldThis = this,
            toReplace;

        request.transformed = request.transformed || {};

        var properties = ["url", "headers", "form", "data", "helperAttributes"];

        var pairObject = Helpers.transformFromKeyValue(kvpairs);
        _und.each(properties, function (prop) {
            // check if the prop exists
            if (request[prop] !== undefined) {

                // If already processed by function vars
                toReplace = request.transformed[prop] || request[prop];

                if (typeof request[prop] === "string") {
                    request.transformed[prop] = this._findReplace(toReplace, pairObject, this.ENV_REGEX);
                } else {
                    //The old option of stringify+replace+parse was removed.
                    request.transformed[prop] = _lod.cloneDeep(toReplace);
                    oldThis._traverseJson(request.transformed[prop], oldThis._processNode, pairObject);
                }
            }
        }, this);
        return true;
    },

    _processNode: function (key, value, pairObject) {
        if (typeof key === "string") {
            key = this._findReplace(key, pairObject, this.ENV_REGEX);
        }
        if (typeof value === "string") {
            value = this._findReplace(value, pairObject, this.ENV_REGEX);
        }
        return {
            "key": key,
            "value": value
        };
    },

    _traverseJson: function (o, func, pairObject) {
        if(!o) {
            return;
        }
        if (o._visited) {
            //To prevent traversing cycling objects
            return;
        }
        o._visited = true;
        for (var i in o) {
            var newData = func.apply(this, [i, o[i], pairObject]);
            delete o[i];
            o[newData.key] = newData.value;
            i = newData.key;
            if (o[i] !== null && typeof(o[i]) === "object") {
                //going on step down in the object tree!!
                this._traverseJson(o[i], func, pairObject);
            }
        }
        delete o._visited;
    },


    /**
     * Modifies request by processing all the variables
     * @param {RequestModel} request
     * @memberof VariableProcessor
     * @param {JSON} options passed to Newman runner
     */
    processRequestVariables: function (request, options) {
        this._resetFunctionVariables();
        this._processPathVariable(request);
        this._processFunctionVariable(request);
        this._processEnvVariable(request, options.envJson);
    }
});

module.exports = VariableProcessor;
