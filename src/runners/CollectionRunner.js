var jsface          = require("jsface"),
	AbstractRunner  = require("./AbstractRunner"),
	RequestRunner   = require("./RequestRunner"),
	ResponseHandlerFactory = require('../responseHandlers/ResponseHandlerFactory'),
	_und = require('underscore'),
	Options = require('../utilities/Options');


/**
 * @class CollectionRunner
 * @param {CollectionModel} collection Takes a Collection of RequestModel
 * as a input and executes the RequestRunner on them.
 * @extends AbstractRunner
 * @mixes Options
 */
var CollectionRunner = jsface.Class([AbstractRunner, Options], {
	constructor: function(collection, options) {
		this.$class.$super.call(this, collection);
		this.setOptions(options);
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
		var ResponseHandler = ResponseHandlerFactory.createResponseHandler(this.getOptions());
		ResponseHandler.initialize();

		// Start the runner 
		RequestRunner.start();
		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;
