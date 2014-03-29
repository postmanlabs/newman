var jsface = require("jsface");

/**
 * @class AbstractRunner
 * @param CollectionJson {JSON} Takes a JSON as the input
 */
var AbstractRunner = jsface.Class({
	constructor: function(collection) {
		this.collection = collection || [];
	},

	execute: function() {
		return this;
	}
});

module.exports = AbstractRunner;
