var jsface                 = require("jsface"),
	AbstractRunner         = require("./AbstractRunner"),
	RequestRunner          = require("./RequestRunner"),
	ResponseHandlerFactory = require('../responseHandlers/ResponseHandlerFactory'),
	_und                   = require('underscore'),
	log                    = require('../utilities/Logger'),
	EventEmitter           = require('../utilities/EventEmitter'),
	Options                = require('../utilities/Options');


/**
 * @class CollectionRunner
 * @param {CollectionModel} collection Takes a Collection of RequestModel
 * as a input and executes the RequestRunner on them.
 * @extends AbstractRunner
 * @mixes Options
 */
var CollectionRunner = jsface.Class([AbstractRunner, Options, EventEmitter], {
	constructor: function(collection, options) {
		this.$class.$super.call(this, collection);
		this.setOptions(options);
	},

	/**
	 * @function
	 * @memberOf CollectionRunner
	 */
	execute: function() {

		// Initialize the response handler using a factory
		var ResponseHandler = ResponseHandlerFactory.createResponseHandler(this.getOptions());
		if (!ResponseHandler) {
			log.throwError('The module provided does not exist.');
		}

		this.addEventListener('requestRunnerOver', function() {
			ResponseHandler.clear();
			this.emit('collectionRunnerOver');
		}.bind(this));

		// Sets up the response handler to respond to the requestExecuted event
		ResponseHandler.initialize();

		_und.each(this.collection, function(postmanRequest) {
			RequestRunner.addRequest(postmanRequest);
		}, this);

		// Start the runner
		RequestRunner.start();

		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;
