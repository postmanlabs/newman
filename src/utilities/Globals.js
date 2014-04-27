var jsface = require('jsface');

/** 
 * @name Globals
 * @namespace
 * @classdesc Globals to be used throught Newman.
 */
var Globals = jsface.Class({
	$singleton: true,

	/**
	 * Used to add the Globals used through out the app
	 * @param {Object} requestJSON Request JSON.
	 * @param {Object} options Newman Options.
	 */
	addEnvironmentGlobals: function(requestJSON, options) {
		this.requestJSON = requestJSON;
		this.envJson = options.envJson || {};
		this.iterationNumber = 1;
		this.outputFile = options.outputFile || '';
		this.globalJSON = options.globalJSON || [];
	}
});

module.exports = Globals;
