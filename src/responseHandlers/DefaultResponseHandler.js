var jsface                 = require('jsface'),
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
		AbstractResponseHandler._onRequestExecuted.call(this, error, response, body, request);
	}
});

module.exports = DefaultResponseHandler;
