var jsface       = require('jsface'),
	log                    = require('../utilities/Logger'),
	ErrorHandler           = require('../utilities/ErrorHandler'),
	EventEmitter = require('../utilities/EventEmitter'),
	ResponseExporter = require('../utilities/ResponseExporter');

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
	_onRequestExecuted: function(error, response, body, request, tests) {
		ResponseExporter.addResult(request, response, tests);
		if (error) {
			ErrorHandler.requestError(request, error);
		} else  {
			this._printResponse(error, response, body, request);
		}
	},

	_printResponse: function(error, response, body, request) {
		if (response.statusCode >= 200 && response.statusCode < 300) {
			log.success(response.statusCode);
		} else {
			ErrorHandler.responseError(response);
		}
		log
		.notice(" " + response.stats.timeTaken + "ms")
		.normal(" " + request.name + " ")
		.light(request.url + "\n");
	},

	// clears up the set event
	clear: function() {
		this.removeEventListener('requestExecuted', this._bindedOnRequestExecuted);
	}
});

module.exports = AbstractResponseHandler;
