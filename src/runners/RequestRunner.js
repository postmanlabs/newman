var jsface            = require('jsface'),
	unirest           = require('unirest'),
	Queue             = require('../utilities/Queue'),
	Helpers           = require('../utilities/Helpers'),
	Globals           = require('../utilities/Globals'),
	EventEmitter      = require('../utilities/EventEmitter'),
	VariableProcessor = require('../utilities/VariableProcessor.js'),
    PreRequestScripter= require('../utilities/PreRequestScriptProcessor.js'),
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
		this._bindedOnRequestExecuted = this._onRequestExecuted.bind(this);
		this.addEventListener('requestExecuted', this._bindedOnRequestExecuted);
		this._execute();
	},

    _getPropertyFromArray: function(array, propName) {
        return _und.find(array,function(elem) {
            return (propName===("{{"+elem.key+"}}"));
        });
    },

    _addGlobalData: function(oldArray, newArray) {
        var finalArray = [];
        var oLen = oldArray.length;
        for(var i=0;i<oLen;i++) {
            var thisValue=oldArray[i].value;
            var actualValue=this._getPropertyFromArray(newArray,thisValue);
            if(typeof actualValue==="undefined") {
                finalArray.push({"key":oldArray[i].key,"value":thisValue, "type":oldArray[i].type});
            }
            else {
                finalArray.push({"key":oldArray[i].key,"value":actualValue.value, "type":oldArray[i].type});
            }
        }
        return finalArray;
    },

	// Gets a request from the queue and executes it.
	_execute: function() {
		var request = this.getFromQueue();
		if (request) {
            var oldGlobals = Globals.envJson;
            this._processUrlUsingEnvVariables(request); //to process ENV and DATAFILE variables
            PreRequestScripter.runPreRequestScript(request);
			this._processUrlUsingEnvVariables(request); //to process PreRequestScript variables
            request.transformed.url = this._ensureUrlPrefix(request.transformed.url);
			var RequestOptions = this._getRequestOptions(request);
            //request.data=request.transformed.data;
            var oldRequestData = request.data;
            request.data=this._addGlobalData(request.data,Globals.envJson.values);
			request.startTime = new Date().getTime();
            RequestOptions.rejectUnauthorized=false;
			var unireq = unirest.request(RequestOptions, function(error, response, body) {
				if(response) {
					// save some stats, only if response exists
					this._appendStatsToReponse(request, response);
				} else {
					// initialize response for reporting and testcases
					response = {
						stats: { timeTaken: 0},
						statusCode: 0,
						headers: []
					};
				}

				// emit event to signal request has been executed
				this.emit('requestExecuted', error, response, body, request);
			}.bind(this));

			this._setFormDataIfParamsInRequest(unireq, request);
            Globals.envJson = oldGlobals;
            request.data=oldRequestData;
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
		RequestOptions.url = request.transformed.url;
		RequestOptions.method = request.method;
		RequestOptions.headers = Helpers.generateHeaderObj(request.transformed.headers);
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
				RequestOptions.body = request.transformed.data;
			} else if (request.dataMode === "urlencoded") {
				var reqData = request.transformed.data;
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

	// placeholder function to append stats to response
	_appendStatsToReponse: function(req, res) {
		res.stats = {};
		res.stats.timeTaken = new Date().getTime() - req.startTime;
	},

    //ensures the return value is prefixed with http://
    _ensureUrlPrefix: function(str) {
        if(str.indexOf("http://") === -1 && str.indexOf("https://") === -1) {
            return "http://"+str;
        }
        return str;
    },

	_processUrlUsingEnvVariables: function(request) {
		VariableProcessor.processRequestVariables(request, {
			envJson: Globals.envJson
		});
	}
});

module.exports = RequestRunner;
