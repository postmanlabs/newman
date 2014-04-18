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
	},
	
	_printResponse: function(error, response, body, request) {
		//@viig99: this.$class.$super.call(this); - $super object is not available inside 
		//this function. Any clue why?
		AbstractResponseHandler._printResponse(error, response, body, request);
	}
});

module.exports = DefaultResponseHandler;
