var jsface = require("jsface"),
	AbstractRunner = require("./AbstractRunner"),
	request = require('ahr2'),
	_und = require('underscore');

var CollectionRunner = jsface.Class(AbstractRunner, {
	constructor: function(collection) {
		this.$class.$super.call(this, collection);
	},
	execute: function() {
		_und.each(this.collection, function(postmanRequest) {
			postmanRequest.execute();

			/*
			 * If Success send the Response to approriate module
			 * 	1) DefaultResponseHandler.
			 *  2) TestReponseHandler.
			 * Else
			 * 	Handler the errors in ErrorHandler module.
			 * Use Logger Class for all logging.
			 */
		});
		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;
