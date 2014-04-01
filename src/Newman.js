var jsface           = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	CollectionModel  = require('./models/CollectionModel.js'),
	Options          = require('./utilities/Options.js');

/**
 * @name Newman
 * @classdesc Bootstrap Newman class, mixin from Options class
 * @namespace
 */
var Newman = jsface.Class([Options], {
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

		var collectionModel = new CollectionModel(requestJSON);
		var marshalledCollection = collectionModel.getMarshalledRequests(this.getOptions());

		var runner = new CollectionRunner(marshalledCollection);
		runner.execute();
	}
});

module.exports = Newman;
