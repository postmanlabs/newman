var jsface          = require("jsface"),
	IterationRunner = require("./runners/IterationRunner"),
	EventEmitter     = require('./utilities/EventEmitter'),
	Globals          = require('./utilities/Globals'),
	Options          = require('./utilities/Options');

/**
 * @name Newman
 * @classdesc Bootstrap Newman class, mixin from Options class
 * @namespace
 */
var Newman = jsface.Class([Options, EventEmitter], {
	$singleton: true,

	/**
	 * Executes XHR Requests for the Postman request, and logs the responses 
	 * & runs tests on them.
	 * @param  {JSON} requestJSON Takes the Postman Collection JSON from a file or url.
	 * @memberOf Newman
	 * @param {object} Newman options
	 */
	execute: function(requestJSON, options, callback) {
		Globals.addEnvironmentGlobals(requestJSON, options);
		this.setOptions(options);

		if (typeof callback === "function") {
			this.addEventListener('iterationRunnerOver', callback);
		}

		// setup the iteration runner with requestJSON passed and options
		this.iterationRunner = new IterationRunner(requestJSON, this.getOptions());

		this.iterationRunner.execute();
	}
});

module.exports = Newman;
