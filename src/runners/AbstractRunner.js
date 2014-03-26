/**
 * [Abstract Runner Class]
 * @author {Arjun Variar}
 */

var jsface = require("jsface");

var AbstractRunner = jsface.Class({
	constructor: function(collection) {
		this.collection = collection || [];
	},

	/**
	 * [execute Main Method which is called when executing the Runner Class]
	 * @return {[AbstractRunner]} [Returns itself for function chaining.]
	 */
	execute: function() {
		return this;
	}
});

module.exports = AbstractRunner;