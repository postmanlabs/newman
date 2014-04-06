var jsface                  = require('jsface'),
	DefaultResponseHandler  = require('./DefaultResponseHandler'),
	AbstractResponseHandler = require('./AbstractResponseHandler');

/**
 * @class ResponseHandlerFactory
 * @classdesc 
 * @mixes EventEmitter
 */
var ResponseHandlerFactory = jsface.Class({
	$singleton: true,

	/**
	 * returns a requestHandler that inherits from the 
	 * AbstractRequestHandler class
	 */
	createRequestHandler: function(options) {
		if (options.customRequestHandler === undefined) {
			return DefaultResponseHandler;
		} else {
			// TODO: How to return a new object?
		}
	}
});

module.exports = ResponseHandlerFactory;
