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

	// TODO: Make {{}} configurable
	$statics: {
		ENV_REGEX: /\{\{([a-z1-9\-._]+)\}\}/ig,
		PATH_REGEX: /:([a-z1-9\-._]+)/ig,
		FUNCTION_REGEX: /\$([a-z1-9\-._]+)/ig
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

	// replaces a string based on keys in the sourceObject as matched by a 
	// regex. Supports recursive replacement
	// usage: _findReplace("{{url}}/blog/posts/{{id}}", {url: "http://localhost", id: 2}, this.ENV_REGEX)
	// Note: The regex provided should capture the key to be replaced (use parenthesis)
	_findReplace: function(stringSource, sourceObject, REGEX) {
		function getKey(match, key){
			return sourceObject[key];
		}
		stringSource = stringSource.replace(REGEX, getKey);  

		if (stringSource.match(REGEX)){
			return this._findReplace(stringSource, sourceObject, REGEX);
		} else {
			return stringSource;
		}
	},

	// transforms the request as per the environment json data passed
	_processEnvVariable: function(request, envJson) {
		var kvpairs = envJson["values"];
		
		if (kvpairs === undefined) {
			log.error("Incorrect environment JSON file.");
			return false;
		}

		var properties = ["url", "headers", "form", "data"];

		var pairObject = this._transformPairs(kvpairs);
		_und.each(properties, function(prop) {

			// check if the prop exists
			if (request[prop] !== undefined)  {
				if (typeof request[prop] === "string") {
					// if string, use directly
					request[prop] = this._findReplace(request[prop], pairObject, this.ENV_REGEX);
				} else {
					// if not string, stringify it
					// findReplace, unstringify it and set it
					var jsonifiedProp = JSON.stringify(request[prop]);
					var parsedJsonProp = JSON.parse(this._findReplace(jsonifiedProp, pairObject, this.ENV_REGEX));
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
