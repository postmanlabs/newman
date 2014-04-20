var jsface                 = require('jsface'),
	log                    = require('../utilities/Logger'),
	ErrorHandler           = require('../utilities/ErrorHandler'),
	AbstractResponseHandler = require('./AbstractResponseHandler');

/**
 * @class DefaultResponseHandler
 * @classdesc
 * @extends AbstractResponseHandler
 */
var DefaultResponseHandler = jsface.Class(AbstractResponseHandler, {
	$singleton: true,

	// function called when the event "requestExecuted" is fired. Takes 4 self-explanatory parameters
	_onRequestExecuted: function(error, response, body, request) {
		if (error){ 
			ErrorHandler.requestError(request, error);
		} else  {
			this._printResponse(error, response, body, request);
		}
	}
});

module.exports = DefaultResponseHandler;
