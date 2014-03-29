var jsface = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	CollectionModel = require('./models/CollectionModel.js');

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
	 * @param  {JSON} requestJSON Takes the Postman Collection JSON from a file
	 * or url.
	 * @memberOf Newman
	 */
	execute: function(requestJSON) {
		var marshalledCollection = new CollectionModel(requestJSON).getOrderedRequests();

		var runner = new CollectionRunner(marshalledCollection);
		runner.execute();
	}
});

module.exports = Newman;
