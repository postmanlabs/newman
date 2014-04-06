var jsface          = require("jsface"),
	AbstractRunner  = require("./AbstractRunner"),
	RequestRunner   = require("./RequestRunner"),
	ResponseHandler = require('../responseHandlers/DefaultResponseHandler.js'),
	_und            = require('underscore');

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
			RequestRunner.addRequest(postmanRequest);
		}, this);
		RequestRunner.start();
		ResponseHandler.initialize();
		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;
