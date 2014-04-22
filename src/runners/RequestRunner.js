var jsface            = require('jsface'),
	unirest           = require('unirest'),
	log               = require('../utilities/Logger'),
	Queue             = require('../utilities/Queue'),
	Globals           = require('../utilities/Globals'),
	EventEmitter      = require('../utilities/EventEmitter'),
	VariableProcessor = require('../utilities/VariableProcessor.js'),
	_und              = require('underscore');

/**
 * @class RequestRunner
 * @classdesc RequestRunner is a singleton object which fires the XHR and takes the
 * appropriate action on the response.
 * @mixes EventEmitter , Queue
 */
var RequestRunner = jsface.Class([Queue, EventEmitter], {
	$singleton: true,

	$statics: {
		METHODS_WHICH_ALLOW_BODY: ['POST','PUT','PATCH','DELETE','LINK','UNLINK','LOCK','PROPFIND']
	},

	/**
	 * Adds the Request to the RequestRunner's queue.
	 * @memberOf RequestRunner
	 * @param {RequestModel} request Takes a RequestModel Object.
	 */
	addRequest: function(request) {
		this.addToQueue(request);
	},

	/**
	 * Starts the RequestRunner going to each request in the queue.
	 * @memberOf RequestRunner
	 */
	start: function() {
		this._execute();
		this._bindedOnRequestExecuted = this._onRequestExecuted.bind(this);
		this.addEventListener('requestExecuted', this._bindedOnRequestExecuted);
	},

	// Gets a request from the queue and executes it.
	_execute: function() {
		var request = this.getFromQueue();
		if (request) {
			this._processUrlUsingEnvVariables(request);
			var RequestOptions = this._getRequestOptions(request);
			request.startTime = new Date().getTime();
			var unireq = unirest.request(RequestOptions, function(error, response, body) {
				if(response) {
					// save some stats, only if response exists
					this._appendStatsToReponse(request, response);
				}

				// emit event to signal request has been executed
				this.emit('requestExecuted', error, response, body, request);
			}.bind(this));

			this._setFormDataIfParamsInRequest(unireq, request);
		} else {
			this._destroy();
		}
	},

	// clean up the requestrunner
	_destroy: function() {
		this.removeEventListener('requestExecuted', this._bindedOnRequestExecuted);
		this.emit('requestRunnerOver');
	},

	_onRequestExecuted: function(error, response, body, request) {
		// Call the next request to execute
		this._execute();
	},

	// Generates and returns the request Options to be used by unirest.
	_getRequestOptions: function(request) {
		var RequestOptions = {};
		//TODO: @Viig99 - Not yet complete. Need your help to identify possible request properties
		//that need to be replaced here by their tranformed values
		RequestOptions.url = request.transformed.url;
		RequestOptions.method = request.method;
		RequestOptions.headers = this._generateHeaders(request.headers);
		RequestOptions.followAllRedirects = true;
		RequestOptions.jar = true;
		this._setBodyData(RequestOptions, request);
		return RequestOptions;
	},

	// Takes request as the input, parses it for different types and
	// sets it as the request body for the unirest request.
	_setBodyData: function(RequestOptions, request) {
		if (RequestRunner.METHODS_WHICH_ALLOW_BODY.indexOf(request.method) > -1) {
			if (request.dataMode === "raw") {
				RequestOptions.body = request.data;
			} else if (request.dataMode === "urlencoded") {
				var reqData = request.data;
				RequestOptions.form = _und.object(_und.pluck(reqData, "key"), _und.pluck(reqData, "value"));
			}
		}
	},

	// Request Mumbo jumbo for `multipart/form-data`.
	_setFormDataIfParamsInRequest: function(unireq, request) {
		if (RequestRunner.METHODS_WHICH_ALLOW_BODY.indexOf(request.method) > -1 && request.dataMode === "params" && request.data.length > 0) {
			var form = unireq.form();
			_und.each(request.data, function(dataObj) {
				// TODO: @viig99 add other types like File Stream, Blob, Buffer.
				if (dataObj.type === 'text') {
					form.append(dataObj.key, dataObj.value);
				}
			});
		}
	},

	_generateHeaders: function(headers) {
		var headerObj = {};
		headers.split('\n').forEach(function(str) {
			if (str) {
				var splitIndex = str.indexOf(':');
				headerObj[str.substr(0,splitIndex)] = str.substr(splitIndex + 1).trim();
			}
		});
		return headerObj;
	},

	// placeholder function to append stats to response
	_appendStatsToReponse: function(req, res) {
		res.stats = {};
		res.stats.timeTaken = new Date().getTime() - req.startTime;
	},

	_processUrlUsingEnvVariables: function(request) {
		VariableProcessor.processRequestVariables(request, {
			envJson: Globals.envJson
		});
	}
});

module.exports = RequestRunner;
