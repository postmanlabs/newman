var jsface                 = require('jsface'),
	log                    = require('../utilities/Logger'),
	AbstractResponseHandler = require('./AbstractResponseHandler.js');

/**
 * @class DefaultResponseHandler
 * @classdesc 
 * @extends AbstractResponseHandler
 */
var DefaultResponseHandler = jsface.Class(AbstractResponseHandler, {
	$singleton: true,
	
	// function called when the event "requestExecuted" is fired. Takes 4 self-explanatory paramters
	onRequestExecuted: function(error, response, body, request) {
		if (error) {
			log.error(request.id + " terminated with the error " + error.code + "\n");
		} else {
			// TODO, @prakhar1989 can you please refactor this into your Response handler.
			if (response.statusCode >= 200 && response.statusCode < 300) {
				log.success(response.statusCode);
			} else {
				log.error(response.statusCode);
			}
			log.notice(" " + response.stats.timeTaken + "ms");
			log.normal(" " + request.name);
			log.light(" " + request.description + "\n");
		}
	}
});

module.exports = DefaultResponseHandler;
