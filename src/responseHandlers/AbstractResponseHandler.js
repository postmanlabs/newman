var jsface       = require('jsface'),
	log          = require('../utilities/Logger'),
	EventEmitter = require('../utilities/EventEmitter.js');

/**
 * @class AbstractResponseHandler
 * @classdesc 
 * @mixes EventEmitter
 */
var AbstractResponseHandler = jsface.Class([EventEmitter], {
	$singleton: true,
	
	/**
	 * Sets up the event listener for the request executed event emitted on each 
	 * request execution
	 * @memberOf AbstractResponseHandler
	 */
	initialize: function() {
		this.addEventListener('requestExecuted', this._onRequestExecuted.bind(this));
	},

	// method to be over-ridden by the inheriting classes
	_onRequestExecuted: function(error, response, body, request) {
	}
});

module.exports = AbstractResponseHandler;
