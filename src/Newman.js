var jsface = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	CollectionModel = require('./models/CollectionModel.js');

/**
 * @class Newman
 * Bootstrap Newman class
 */
var Newman = jsface.Class({
	$singleton: true,

	execute: function(requestJSON) {
		var marshalledCollection = new CollectionModel(requestJSON).getOrderedRequests();

		var runner = new CollectionRunner(marshalledCollection);
		runner.execute();
	}
});

module.exports = Newman;
