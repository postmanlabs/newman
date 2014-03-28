var jsface = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	RequestMarshaller = require("./marshallers/RequestMarshaller");

var Newman = jsface.Class({
	$singleton: true,

	execute: function(requestJSON) {
		var marshalledCollection = new RequestMarshaller(requestJSON).getMarshalledCollection();

		var runner = new CollectionRunner(marshalledCollection);
		runner.execute();
	}
});

module.exports = Newman;
