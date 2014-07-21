var jsface                  = require('jsface'),
    _und                    = require('underscore'),
    vm                      = require('vm'),
    ErrorHandler            = require('./ErrorHandler'),
    window                  = require("jsdom-nogyp").jsdom().parentWindow,
    _jq                     = require("jquery")(window),
    _lod                    = require("lodash"),
    Helpers                 = require('./Helpers'),
    Backbone                = require("backbone"),
    xmlToJson               = require("xml2js"),
    Globals                 = require("./Globals"),
    tv4                     = require("tv4");


/**
 * @class PreRequestScriptProcessor
 * @classdesc Class Used for exporting the generated responses.
 */
var PreRequestScriptProcessor = jsface.Class({
    $singleton: true,
    _results: [],

    /**
     * Execute the preRequestScript for this request, and add to the global env vars
     * It's the responsibility of the CALLER to save and restore the original global state
     * @param {Object} request: the request object
     */
    runPreRequestScript: function(request) {
        var requestScript = this._getScriptForRequest(request);
        if (requestScript) {
            var sandbox = this._createSandboxedEnvironment(request);
            return this._runScript(request.preRequestScript, sandbox);
        }
        return {};
    },

    _getScriptForRequest: function(request) {
        return !!request.preRequestScript;
    },

    // run the preRequestScript in a sandbox. Add to the global env vars
    _runScript: function(requestScript, sandbox) {
        this._evaluateInSandboxedEnvironment(requestScript, sandbox);
        //do we return here??
        //env vars are already set - no Impact on test results or anything
        return;
    },

    _evaluateInSandboxedEnvironment: function(requestScript, sandbox) {
        var sweet= "for(p in sugar.object) Object.prototype[p]  = sugar.object[p];";
        sweet += "for(p in sugar.array)  Array.prototype[p]   = sugar.array[p];";
        sweet += "for(p in sugar.string) String.prototype[p]  = sugar.string[p];";
        sweet += "for(p in sugar.date)   Date.prototype[p]    = sugar.date[p];";
        sweet += "for(p in sugar.funcs)  Function.prototype[p]= sugar.funcs[p];";
        requestScript = sweet + 'String.prototype.has = function(value){ return this.indexOf(value) > -1};' + requestScript;
        try {
            vm.runInNewContext(requestScript, sandbox);
        } catch (err) {
            ErrorHandler.exceptionError(err);
        }
        //what do we return??
        //return sandbox.tests;
    },

    // sets the env vars json as a key value pair
    _setEnvironmentContext: function() {
        return Helpers.transformFromKeyValue(Globals.envJson.values);
    },

    // sets the global vars json as a key value pair
    _setGlobalContext: function() {
        return Helpers.transformFromKeyValue(Globals.globalJson.values);
    },

    // sets the data vars json as a key value pair
    _setDataContext: function() {
        return Helpers.transformFromKeyValue(Globals.dataJson.values);
    },

    _getTransformedRequestData: function(request) {
        var transformedData;

        if (request.transformed.data === "") {
            return {};
        }
        if (request.dataMode === "raw") {
            transformedData = request.transformed.data;
        } else {
            transformedData = Helpers.transformFromKeyValue(request.transformed.data);
        }
        return transformedData;
    },

    _createSandboxedEnvironment: function(request) {
        var sugar = { array:{}, object:{}, string:{}, funcs:{}, date:{} };
        Object.getOwnPropertyNames(Array.prototype).each(function(p) { sugar.array[p] = Array.prototype[p];});
        Object.getOwnPropertyNames(Object.prototype).each(function(p) { sugar.object[p] = Object.prototype[p];});
        Object.getOwnPropertyNames(String.prototype).each(function(p) { sugar.string[p] = String.prototype[p];});
        Object.getOwnPropertyNames(Date.prototype).each(function(p) { sugar.date[p] = Date.prototype[p];});
        Object.getOwnPropertyNames(Function.prototype).each(function(p) { sugar.funcs[p] = Function.prototype[p];});
        return {
            sugar: sugar,
            request: {
                url: request.transformed.url,
                method: request.method,
                headers: Helpers.generateHeaderObj(request.transformed.headers),
                data: this._getTransformedRequestData(request),
                dataMode: request.dataMode
            },
            iteration: Globals.iterationNumber,
            environment: this._setEnvironmentContext(),
            globals: this._setGlobalContext(),
            data: this._setDataContext(),
            $: _jq,
            _: _lod,
            Backbone: Backbone,
            xmlToJson: function(string) {
                var JSON = {};
                xmlToJson.parseString(string, {explicitArray: false,async: false}, function (err, result) {
                    JSON = result;
                });
                return JSON;
            },
            tv4: tv4,
            console: {log: function(msg){console.log(msg);}},
            postman: {
                setEnvironmentVariable: function(key, value) {
                    var envVar = _und.find(Globals.envJson.values, function(envObject){
                        return envObject["key"] === key;
                    });

                    if (envVar) { // if the envVariable exists replace it
                        envVar["value"] = value;
                    } else { // else add a new envVariable
                        Globals.envJson.values.push({
                            key: key,
                            value: value,
                            type: "text",
                            name: key
                        });
                    }
                },
                getEnvironmentVariable: function(key) {
                    var envVar = _und.find(Globals.envJson.values, function(envObject){
                        return envObject["key"] === key;
                    });
                    if(envVar) {
                        return envVar["value"];
                    }
                    return null;
                },
                setGlobalVariable: function(key, value) {
                    var envVar = _und.find(Globals.globalJson.values, function(envObject){
                        return envObject["key"] === key;
                    });

                    if (envVar) { // if the envVariable exists replace it
                        envVar["value"] = value;
                    } else { // else add a new envVariable
                        Globals.globalJson.values.push({
                            key: key,
                            value: value,
                            type: "text",
                            name: key
                        });
                    }
                },
                getGlobalVariable: function(key) {
                    var envVar = _und.find(Globals.globalJson.values, function(envObject){
                        return envObject["key"] === key;
                    });
                    if(envVar) {
                        return envVar["value"];
                    }
                    return null;
                }
            }
        };
    }
});

module.exports = PreRequestScriptProcessor;