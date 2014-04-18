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
		this._bindedOnRequestExecuted = this._onRequestExecuted.bind(this);
		this.addEventListener('requestExecuted', this._bindedOnRequestExecuted);
	},

	// method to be over-ridden by the inheriting classes
	_onRequestExecuted: function(error, response, body, request) {
	},

	// clears up the set event
	clear: function() {
		this.removeEventListener('requestExecuted', this._bindedOnRequestExecuted);
	}
});

module.exports = AbstractResponseHandler;
