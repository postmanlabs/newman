var jsface                  = require('jsface'),
	DefaultResponseHandler  = require('./DefaultResponseHandler'),
	AbstractResponseHandler = require('./AbstractResponseHandler');

/**
 * @class ResponseHandlerFactory
 * @classdesc 
 */
var ResponseHandlerFactory = jsface.Class({
	$singleton: true,

	/**
	 * @function
	 * @memberOf ResponseHandlerFactory
	 * @param {JSON} options
	 * returns a responseHandler that inherits from the 
	 * AbstractRequestHandler class
	 */
	createResponseHandler: function(options) {
		if (options.responseHandler === undefined) {
			return DefaultResponseHandler;
		} else {
			// TODO: How to return a new object?
			// TODO: Check if the file exists else error?
			return require('./' + options.responseHandler);
		}
	}
});

module.exports = ResponseHandlerFactory;
