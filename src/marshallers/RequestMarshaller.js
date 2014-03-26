var jsface = require("jsface");

var RequestMarshaller = jsface.Class({
	constructor: function(collectionJson) {
		// TODO: Generate Marshalled Requests from the exportred Postman Collection.
		return this;
	},
	getCollections: function() {
		return this.collections;
	}
});

module.exports = RequestMarshaller;