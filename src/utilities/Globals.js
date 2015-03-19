var jsface = require('jsface');
var packageVersion = require('../../package.json').version;

/** 
 * @name Globals
 * @namespace
 * @classdesc Globals to be used throught Newman.
 */
var Globals = jsface.Class({
	$singleton: true,

	newmanVersion: packageVersion,

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
		this.testReportFile = options.testReportFile || '';
		this.globalJson = options.globalJSON || [];
        this.dataJson = [];
		this.stopOnError = options.stopOnError;
		this.noColor = options.noColor;
		this.asLibrary = options.asLibrary;
		this.strictSSL = options.strictSSL || true;
		this.exitCode=0;
		this.updateMessage="";
		this.folder = options.folderName || false;
		this.iterationCount = options.iterationCount || 1;
		this.html = options.html || false;
		this.responseEncoding = options.responseEncoding;
	}
});

module.exports = Globals;
