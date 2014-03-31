var jsface           = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	CollectionModel  = require('./models/CollectionModel.js');

/**
 * @name Newman
 * @classdesc Bootstrap Newman class
 * @namespace
 */
var Newman = jsface.Class({
	$singleton: true,

	/**
	 * Executes XHR Requests for the Postman request, and logs the responses 
	 * & runs tests on them.
	 * @param  {JSON} requestJSON Takes the Postman Collection JSON from a file or url.
	 * @memberOf Newman
	 * @param {object} Newman options
	 */
	execute: function(requestJSON, options) {
		var collectionModel = new CollectionModel(requestJSON);
		var marshalledCollection = collectionModel.getMarshalledRequests(options);

		var runner = new CollectionRunner(marshalledCollection);
		runner.execute();
	}
});

module.exports = Newman;
