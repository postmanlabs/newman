var jsface          = require("jsface"),
	AbstractRunner  = require("./AbstractRunner"),
	RequestRunner   = require("./RequestRunner"),
	ResponseHandlerFactory = require('../responseHandlers/ResponseHandlerFactory.js'),
	_und            = require('underscore');

/**
 * @class CollectionRunner
 * @param {CollectionModel} collection Takes a Collection of RequestModel
 * as a input and executes the RequestRunner on them.
 * @extends AbstractRunner
 */
var CollectionRunner = jsface.Class(AbstractRunner, {
	constructor: function(collection, options) {
		this.$class.$super.call(this, collection);
		this.options = options;
	},
	/**
	 * @function
	 * @memberOf CollectionRunner
	 */
	execute: function() {
		_und.each(this.collection, function(postmanRequest) {
			RequestRunner.addRequest(postmanRequest);
		}, this);

		// Initialize the response handler using a factory
		ResponseHandler = ResponseHandlerFactory.createRequestHandler(this.options);
		ResponseHandler.initialize();

		// Start the runner 
		RequestRunner.start();
		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;
