var jsface           = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
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
		this.iterationCount = this.getOptions().iterationCount - 1 || 0;

		// initialize the collection model from raw json
		var collectionModel = new CollectionModel(requestJSON);

		// refers to the collection of processed requests
		var marshalledCollection = collectionModel.getMarshalledRequests(this.getOptions());

		this.addEventListener('collectionRunnerOver', function() {
			console.log("request over \n");
			if (this.iterationCount) {
				this.iterationCount -= 1;
				this.runIteration(marshalledCollection);
			}
		}.bind(this));
		
		this.runIteration(marshalledCollection);
	}, 

	// can go into a new class later on
	runIteration: function(marshalledCollection) {
		var runner = new CollectionRunner(marshalledCollection, this.getOptions());
		runner.execute();
	}
});

module.exports = Newman;
