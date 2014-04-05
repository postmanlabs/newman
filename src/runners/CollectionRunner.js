var jsface = require("jsface"),
	AbstractRunner = require("./AbstractRunner"),
	RequestRunner = require("./RequestRunner"),
	_und = require('underscore');

/**
 * @class CollectionRunner
 * @param {CollectionModel} collection Takes a Collection of RequestModel
 * as a input and executes the RequestRunner on them.
 * @extends AbstractRunner
 */
var CollectionRunner = jsface.Class(AbstractRunner, {
	constructor: function(collection) {
		this.$class.$super.call(this, collection);
	},
	/**
	 * @function
	 * @memberOf CollectionRunner
	 */
	execute: function() {
		_und.each(this.collection, function(postmanRequest) {
			/*
			 * If Success send the Response to approriate module
			 * 1) DefaultResponseHandler.
			 * 2) TestReponseHandler.
			 * Else
			 * Handler the errors in ErrorHandler module.
			 * Use Logger Class for all logging.
			 */
			RequestRunner.execute(postmanRequest);
		}, this);
		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;
