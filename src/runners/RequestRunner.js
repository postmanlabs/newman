var jsface            = require('jsface'),
    requestLib        = require('request'),
    Queue             = require('../utilities/Queue'),
    Helpers           = require('../utilities/Helpers'),
    Globals           = require('../utilities/Globals'),
    EventEmitter      = require('../utilities/EventEmitter'),
    Errors            = require('../utilities/ErrorHandler'),
    VariableProcessor = require('../utilities/VariableProcessor.js'),
    prScripter        = require('../utilities/PreRequestScriptProcessor.js'),
    _und              = require('underscore'),
    path              = require('path'),
    fs                = require('fs');

/**
 * @class RequestRunner
 * @classdesc RequestRunner is a singleton object which fires the XHR and takes the
 * appropriate action on the response.
 * @mixes EventEmitter , Queue
 */
var RequestRunner = jsface.Class([Queue, EventEmitter], {
    $singleton: true,

    delay: 0,

    $statics: {
        METHODS_WHICH_ALLOW_BODY: ['POST','PUT','PATCH','DELETE','LINK','UNLINK','LOCK','PROPFIND']
    },

    /**
     * Sets a delay to be used between requests
     * @param delay
     */
    setDelay: function(delay) {
        this.delay = delay;
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
        var runner = this;
        setTimeout(function() {
            runner._execute();
        }, this.delay);
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
		if(Globals.exitCode===1 && Globals.stopOnError===true) {
			return;
		}

        var request = this.getFromQueue();
        if (request) {
            //To be uncommented if each prScript/test should set transient env. vars
            //var oldGlobals = Globals.envJson;
            var oldRequestData = request.data;

            //To remain compatible with Postman - ensure consistency of request.data
            if(request.dataMode === "raw" && request.hasOwnProperty("rawModeData")) {
                if(request.rawModeData !== undefined) {
                    request.data = request.rawModeData;
                }
            }

            //to add Environment and Data variables to the request, because the processed URL is available in the PR script
            this._processUrlUsingEnvVariables(request);
            prScripter.runPreRequestScript(request);
            //to process PreRequestScript variables
            this._processUrlUsingEnvVariables(request);

            request.transformed.url = this._ensureUrlPrefix(request.transformed.url);

            var RequestOptions = this._getRequestOptions(request);

            request.data=request.transformed.data;


            request.startTime = new Date().getTime();
            RequestOptions.rejectUnauthorized=false;
            var unireq = requestLib(RequestOptions, function(error, response, body) {
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
                var delay = this.delay;
                if(this.isEmptyQueue()) {
                    delay = 0;
                }
                this.emit('requestExecuted', error, response, body, request, delay);
            }.bind(this));

            this._setFormDataIfParamsInRequest(unireq, request);
            //To be uncommented if each prScript/test should set transient env. vars
            //Globals.envJson = oldGlobals;

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

    _onRequestExecuted: function(error, response, body, request, delay) {
        // Call the next request to execute
        var runner = this;
        setTimeout(function() {
            runner._execute();
        }, delay);
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
                } else if (dataObj.type === 'file') {
                    var loc = path.resolve(dataObj.value);
                    if(!fs.existsSync(loc)) {
                      Errors.terminateWithError("No file found - "+loc);
                    }
                    form.append(dataObj.key, fs.createReadStream(loc));
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
        var mergedArray = {"values":[]};
        mergedArray.values = Helpers.augmentDataArrays(Globals.globalJson.values,Globals.envJson.values);
        mergedArray.values = Helpers.augmentDataArrays(mergedArray.values, Globals.dataJson.values);

        VariableProcessor.processRequestVariables(request, {
            envJson: mergedArray
        });
    }
});

module.exports = RequestRunner;
