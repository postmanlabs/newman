var jsface = require('jsface'),
	fs     = require('fs'),
	Errors = require('./ErrorHandler'),
	_und   = require('underscore');

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
    validateCollectionUrl: function(url) {
		var result = url.match(/(https|http):\/\/([_a-z\d\-]+(\.[_a-z\d\-]+)+)(([_a-z\d\-\\\.\/]+[_a-z\d\-\\\/])+)*/);
		if (!result)  {
			Errors.terminateWithError("Please specify a valid URL");
		}
    },

	validateDataFile: function(file) {
		if (!fs.existsSync(file)) {
			Errors.terminateWithError("The data file passed is not a valid json / csv file");
		}
	},

    validateCollectionFile: function(file) {
        if (!fs.existsSync(file)) {
            Errors.terminateWithError("Please specify a Postman Collection either as a file or a URL");
        }
    },

    validateEnvironmentFile: function(file) {
        if (!fs.existsSync(file)) {
            Errors.terminateWithError("Please specify a valid Postman environment file");
        }
    },

    validateGlobalFile: function(file) {
        if (!fs.existsSync(file)) {
            Errors.terminateWithError("Please specify a valid Postman globals file");
        }
    },

	// transforms an array of 
	// [{"id": 1, "name":"foo"}, { .. }, ..] 
	// into an object {"key": "id", "value": "foo"}]
	transformToKeyValue: function(json) {
		return _und.map(_und.pairs(json), function(pair){
			return { key: pair[0], value: pair[1] };
		}, []);
	},

	// transforms an array of 
	// [{ "key": "id", "value": "20" }, { "key": "name", "value": "joe" }] 
	// into an object {"id": "20", "name": "joe"}
	transformFromKeyValue: function(kvpairs) {
		return _und.object(_und.pluck(kvpairs, "key"), _und.pluck(kvpairs, "value"));
	},

	// generates a header object from a string where headers are of the form
	// Accept-Language: En\nCache-Control: 123\nPragma: Akamai\n
	generateHeaderObj: function(headers) {
		var headerObj = {};
		headers.split('\n').forEach(function(str) {
			if (str) {
				var splitIndex = str.indexOf(':');
				headerObj[str.substr(0,splitIndex)] = str.substr(splitIndex + 1).trim();
			}
		});
		return headerObj;
	},

    createProperCasedHeaderObject: function(headers) {
        var retVal={};
        for (var key in headers) {
            if(headers.hasOwnProperty(key)) {
                retVal[Helpers.toHeaderCase(key)]=headers[key];
            }
        }
        return retVal;
    },

    toHeaderCase: function(str) {
        var toUpper=true;
        var retVal="";
        var len = str.length;
        var wordBreakers="- ";
        for(var i=0;i<len;i++) {
            if(toUpper) {
                toUpper=false;
                retVal+=str[i].toUpperCase();
            }
            else {
                retVal+=str[i];
            }
            if(wordBreakers.indexOf(str[i])!==-1) {
                toUpper=true;
            }
        }
        return retVal;
    },

    kvArrayToObject: function(array) {
        var obj = {};
        _und.each(array,function(kv) {
            obj[kv.key]=kv.value;
        });
        return obj;
    },

    objectToKvArray: function(obj) {
        var arr=[];
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                arr.push({"key":property, "value":obj[property]});
            }
        }
        return arr;
    },

    augmentDataArrays: function(oldArray, newArray) {
        var existingEnvVars = this.kvArrayToObject(oldArray);
        var dataFileVars = this.kvArrayToObject(newArray);
        var finalObject = existingEnvVars;
        for (var property in dataFileVars) {
            if (dataFileVars.hasOwnProperty(property)) {
                finalObject[property]=dataFileVars[property];
            }
        }
        var finalArray = this.objectToKvArray(finalObject);
        //Globals.envJson.values = finalArray;
        return finalArray;
    }
});

module.exports = Helpers;
