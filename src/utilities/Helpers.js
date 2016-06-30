var jsface = require('jsface'),
    fs = require('fs'),
    Errors = require('./ErrorHandler'),
    CSVHelper = require('./CsvHelper'),
    _und = require('underscore');

/**
 * @name Helpers
 * @namespace
 * @classdesc Helper class with useful methods used throughout Newman
 */
var Helpers = jsface.Class({
    $singleton: true,

    /**
     * @function
     * @memberOf Helpers
     * @param  {String}  url [Takes a URL as an input]
     * @return {Boolean}     [Returns is the url is valid or not.]
     */
    validateCollectionUrl: function (url) {
        var result = url.match(/(https|http):\/\/([_a-z\d\-]+(\.[_a-z\d\-]+)+)(([_a-z\d\-\\\.\/]+[_a-z\d\-\\\/])+)*/);
        if (!result) {
            Errors.terminateWithError("Please specify a valid URL");
        }
    },

    fileExists: function (path) {
        try {
            return fs.statSync(path);
        }
        catch (e) {
            console.log(e.stack || e);
        }
    },

    validateDataFile: function (file) {
        if (!this.fileExists(file)) {
            Errors.terminateWithError("Specified file does not exist: " + file);
        }
    },

    validateCollectionFile: function (file) {
        if (!this.fileExists(file)) {
            Errors.terminateWithError("Specified collection file does not exist: " + file);
        }
    },

    validateEnvironmentFile: function (file) {
        if (!this.fileExists(file)) {
            Errors.terminateWithError("Specified environment file does not exist: " + file);
        }
    },

    validateGlobalFile: function (file) {
        if (!this.fileExists(file)) {
            Errors.terminateWithError("Specified globals does not exist: " + file);
        }
    },

    validateEncoding: function (encoding) {
        var validEncs = ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex'];
        if (validEncs.indexOf(encoding) === -1) {
            Errors.terminateWithError("Please specify a valid encoding. Supported values are ascii,utf8,utf16le,ucs2,base64,binary,hex");
        }
    },

    // transforms an array of
    // [{"id": 1, "name":"foo"}, { .. }, ..]
    // into an object {"key": "id", "value": "foo"}]
    transformToKeyValue: function (json) {
        return _und.map(_und.pairs(json), function (pair) {
            return { key: pair[0], value: pair[1] };
        }, []);
    },

    // transforms an array of
    // [{ "key": "id", "value": "20" }, { "key": "name", "value": "joe" }]
    // into an object {"id": "20", "name": "joe"}
    transformFromKeyValue: function (kvpairs) {
        return _und.object(_und.pluck(kvpairs, "key"), _und.pluck(kvpairs, "value"));
    },

    transformFromKeyValueForRequestData: function (kvpairs) {
        if(!_und.isArray(kvpairs)) {
            return {};
        }
        var retVal = {},
            count = kvpairs.length;
        for(var i = 0; i < count; i++) {
          if(retVal.hasOwnProperty(kvpairs[i].key)) {
            //2 properties with same key. convert to array
            if(retVal[kvpairs[i].key] instanceof Array) {
              retVal[kvpairs[i].key] = retVal[kvpairs[i].key].concat(kvpairs[i].value);
            }
            else {
              retVal[kvpairs[i].key] = [retVal[kvpairs[i].key], kvpairs[i].value];
            }
          }
          else {
            retVal[kvpairs[i].key] = kvpairs[i].value;
          }
        }

        return retVal;
    },

    // generates a header object from a string where headers are of the form
    // Accept-Language: En\nCache-Control: 123\nPragma: Akamai\n
    generateHeaderObj: function (headers) {
        var headerObj = {};
        if (headers && headers.split) {
            headers.split('\n').forEach(function (str) {
                if (str) {
                    var splitIndex = str.indexOf(':');
                    var headerName = str.substr(0, splitIndex);
                    if (headerName.indexOf("//") === 0) {
                        //do nothing...disabled header
                    }
                    else {
                        headerObj[headerName] = str.substr(splitIndex + 1).trim();
                    }
                }
            });
        }
        return headerObj;
    },

    generateHeaderStringFromObj: function (headerObj) {
        var ret = "";
        for (var hKey in headerObj) {
            if (headerObj.hasOwnProperty(hKey)) {
                ret += hKey + ":" + headerObj[hKey] + "\n";
            }
        }
        return ret;
    },

    getResponseHeader: function (headerString, headers) {
        if (headerString == null || headerString.length === 0) {
            return null;
        }
        if (headers.hasOwnProperty(headerString.toLowerCase())) {
            return headers[headerString.toLowerCase()];
        }
        return null;
    },

    createProperCasedHeaderObject: function (headers) {
        var retVal = {};
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                retVal[Helpers.toHeaderCase(key)] = headers[key];
            }
        }
        return retVal;
    },

    toHeaderCase: function (str) {
        var toUpper = true;
        var retVal = "";
        var len = str.length;
        var wordBreakers = "- ";
        for (var i = 0; i < len; i++) {
            if (toUpper) {
                toUpper = false;
                retVal += str[i].toUpperCase();
            }
            else {
                retVal += str[i];
            }
            if (wordBreakers.indexOf(str[i]) !== -1) {
                toUpper = true;
            }
        }
        return retVal;
    },

    kvArrayToObject: function (array) {
        var obj = {};
        _und.each(array, function (kv) {
            obj[kv.key] = kv.value;
        });
        return obj;
    },

    objectToKvArray: function (obj) {
        var arr = [];
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                arr.push({ "key": property, "value": obj[property] });
            }
        }
        return arr;
    },

    augmentDataArrays: function (oldArray, newArray) {
        var existingEnvVars = this.kvArrayToObject(oldArray);
        var dataFileVars = this.kvArrayToObject(newArray);
        var finalObject = existingEnvVars;
        for (var property in dataFileVars) {
            if (dataFileVars.hasOwnProperty(property)) {
                finalObject[property] = dataFileVars[property];
            }
        }
        var finalArray = this.objectToKvArray(finalObject);
        //Globals.envJson.values = finalArray;
        return finalArray;
    },

    CSVUtil: CSVHelper.CSV,

    findPosition: function (list, key, value) {
        var listLength = list.length;
        var pos = -1;
        for (var i = 0; i < listLength; i++) {
            var h = list[i];
            if (h['key'] === value) {
                pos = i;
                break;
            }
        }

        return pos;
    }
});

module.exports = Helpers;
