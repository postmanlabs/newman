var jsface       = require('jsface'),
	EventEmitter = require('../utilities/EventEmitter'),
	_und         = require('underscore'),
	log          = require('../utilities/Logger');

/**
 * @class DefaultResponseHandler
 * @classdesc 
 * @mixes EventEmitter
 */
var DefaultResponseHandler = jsface.Class([EventEmitter], {
	$singleton: true,
	
	/**
	 * Sets up the event listener for the request executed event emitted on each 
	 * request execution
	 * @memberOf DefaultResponseHandler
	 */
	initialize: function() {
		this.addEventListener('requestExecuted', this._onRequestExecuted.bind(this));
	},

	// function called when the event "requestExecuted" is fired. Takes 4 self-explanatory paramters
	_onRequestExecuted: function(error, response, body, request) {
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
