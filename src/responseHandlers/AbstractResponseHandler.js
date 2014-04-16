var jsface       = require('jsface'),
	EventEmitter = require('../utilities/EventEmitter');

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
	},

	// clears up the set event
	clear: function() {
		this.removeEventListener('requestExecuted', this._onRequestExecuted.bind(this));
	}
});

module.exports = AbstractResponseHandler;
