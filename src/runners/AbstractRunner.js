var jsface = require("jsface");

var AbstractRunner = jsface.Class({
	constructor: function(collection) {
		this.collection = collection || [];
	},

	execute: function() {
		return this;
	}
});

module.exports = AbstractRunner;
