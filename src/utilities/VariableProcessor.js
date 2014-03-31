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
		ENV_REGEX      : function(key) {
			return new RegExp("\{\{" + key + "\}\}", 'g');
		}
	},

	getFunctionVariables: {
		"$guid": function() {
			return "secret";
		},
		"$timestamp": (function() {
			return Math.round(new Date().getTime() / 1000) })(),
		"$randomint": (function() {
			return 4; })()
	},

	_processPathVariable: function(request) {
	},

	_processFunctionVariable: function(request) {
	},

	_findReplace: function(source, findKey, replaceVal, regex) {
		return source.replace(regex, replaceVal);
	},

	_processEnvVariable: function(request, envJson) {
		var kvpairs = envJson["values"];
		
		if (kvpairs === undefined) {
			log.error("Incorrect environemnt JSON file.");
			return false;
		}

		// TODO: Add processing code for each of these properties
		properties = ["url", "data", "headers"];

		_und.each(kvpairs, function(pair) {
			request.url =  this._findReplace(request.url, pair["key"], 
					pair["value"], this.ENV_REGEX(pair["key"]));
		}, this);
	},

	_processDataVariable: function(request) {
	},

	getProcessedRequest: function(request, options) {
		this._processEnvVariable(request, options["envJson"]);
	}
});

module.exports = VariableProcessor;
