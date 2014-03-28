var jsface = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	RequestMarshaller = require("./marshallers/RequestMarshaller");

var Newman = jsface.Class({
	$singleton: true,

	execute: function(requestJSON) {
		var marshalledRequestCollection = new RequestMarshaller(requestJSON).getCollection() || [];

		var runner = new CollectionRunner(marshalledRequestCollection);
		runner.execute();
	}
});

module.exports = Newman;
