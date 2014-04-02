var jsface = require('jsface'),
	log    = require('./Logger.js'),
	_und   = require('underscore');

/** 
 * @name VariableProcessor
 * @namespace
 * @classdesc Helper singleton class that does the variable and environment processing for newman
 */
var VariableProcessor = jsface.Class({
	$singleton: true,

	$statics: {
		PATH_REGEX     : new RegExp(),
		FUNCTION_REGEX : new RegExp(),
		MATCH_REGEX: /\{\{[a-z1-9\-._]+\}\}/i
	},

	getFunctionVariables: {
		"$guid": function() {},
		"$timestamp": _und.now(),
		"$randomint": _und.random(0, 1000)
	},

	_processPathVariable: function(request) {
	},

	_processFunctionVariable: function(request) {
	},

	// replaces a string with {{ }} like templates with the key, value as 
	// found in the source object.
	// example: _findReplace("{{url}}/post/{{id}}, { url: "http://localhost", id: 1})
	_findReplace: function(stringSource, sourceObject) {
		function getKey(match){
			if (match === null) return null;
			var m = match[0];
			var key = m.substring(2, m.length-2);
			return sourceObject[key] === undefined ? key : sourceObject[key];
		}
		var key = getKey(stringSource.match(this.MATCH_REGEX));
		stringSource = stringSource.replace(this.MATCH_REGEX, key);  

		if (stringSource.match(this.MATCH_REGEX)){
			return this._findReplace(stringSource, sourceObject);
		} 
		return stringSource;
	},

	// transforms the request as per the environment json data passed
	_processEnvVariable: function(request, envJson) {
		var kvpairs = envJson["values"];
		
		if (kvpairs === undefined) {
			log.error("Incorrect environemnt JSON file.");
			return false;
		}

		var properties = ["url", "headers", "form", "data"];

		var pairObject = this._transformPairs(kvpairs);
		_und.each(properties, function(prop) {

			// check if the prop exists
			if (request[prop] !== undefined)  {
				if (typeof request[prop] === "string") {
					// if string, use directly
					request[prop] = this._findReplace(request[prop], pairObject);
				} else {
					// if not string, stringify it
					// findReplace, unstringify it and set it
					var jsonifiedProp = JSON.stringify(request[prop]);
					var parsedJsonProp = JSON.parse(this._findReplace(jsonifiedProp, pairObject));
					request[prop] = parsedJsonProp;
				}
			}
		}, this);
		return true;
	},

	// transforms an array of 
	// [{ "key": "id", "value": "20" }, { "key": "name", "value": "joe" }] 
	// into an object {"id": "20", "name": "joe"}
	_transformPairs: function(kvpairs) {
		return _und.object(_und.pluck(kvpairs, "key"), _und.pluck(kvpairs, "value"));
	},

	_processDataVariable: function(request) {
	},

	processRequestVariables: function(request, options) {
		this._processEnvVariable(request, options["envJson"]);
	}
});

module.exports = VariableProcessor;
