var jsface           = require("jsface"),
	IterationRunner = require("./runners/IterationRunner"),
	CollectionModel  = require('./models/CollectionModel'),
	Options          = require('./utilities/Options'),
	EventEmitter     = require('./utilities/EventEmitter');

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
	execute: function(requestJSON, options) {
		this.setOptions(options);
		this.iterationCount = this.getOptions().iterationCount || 1;
		var maxCount = this.getOptions().iterationCount || 1;

		// initialize the collection model from raw json
		var collectionModel = new CollectionModel(requestJSON);

		// refers to the collection of processed requests
		var marshalledCollection = collectionModel.getMarshalledRequests(this.getOptions());

		this.iterationRunner = new IterationRunner(marshalledCollection, 
									this.getOptions(), maxCount);

		this.addEventListener('collectionRunnerOver', this._runIteration.bind(this));

		this._runIteration();
	},

	_runIteration: function() {
		if (this.iterationCount) {
			this.iterationCount -= 1;
			this.iterationRunner.execute(this.iterationCount, this.maxCount);
		}
	}
});

module.exports = Newman;
