var jsface = require("jsface"),
	CollectionRunner = require("./runners/CollectionRunner"),
	RequestMarshaller = require("./marshallers/RequestMarshaller");

var Newman = jsface.Class({
	$singleton: true,

	execute: function(requestJSON) {
		// TODO: Marshall the JSON request array.
		var marshalledRequestCollection = new RequestMarshaller(requestJSON).getCollection() || [];

		var runner = new CollectionRunner(marshalledRequestCollection);

		// This will execute the collection & and report the approriate responses,
		// run the test cases & do the error reporting.
		// runner.execute();
	}
});

module.exports = Newman;
