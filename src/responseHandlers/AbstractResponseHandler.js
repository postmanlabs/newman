var jsface = require('jsface'),
    log = require('../utilities/Logger'),
    Globals = require('../utilities/Globals'),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    ErrorHandler = require('../utilities/ErrorHandler'),
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
    initialize: function () {
        this._bindedOnRequestExecuted = this._onRequestExecuted.bind(this);
        this.addEventListener('requestExecuted', this._bindedOnRequestExecuted);
    },

    // method to be over-ridden by the inheriting classes
    _onRequestExecuted: function (error, response, body, request, tests) {
        if (error) {
            ErrorHandler.requestError(request, error);
        } else {
            this._printResponse(error, response, body, request);
        }
        ResponseExporter.addResult(request, response, tests);
    },

    _printResponse: function (error, response, body, request) {
        if (Globals.outputFileVerbose) {
            var filepath = path.resolve(Globals.outputFileVerbose);
            var requestData;

            try {
                requestData = _.isArray(request.transformed.data) ? JSON.stringify(_.object(_.pluck(request.transformed.data, "key"),
                    _.pluck(request.transformed.data, "value")), null, 2) : request.transformed.data;
            }
            catch (e) {
                // Not JSON.
                requestData = request.transformed.data;
            }

            var requestString = "-------------------------------------------------------------------------------------------\n" +
                response.statusCode + " " +
                response.stats.timeTaken + "ms" + " " +
                request.name + " " + "[" + request.method + "] " +
                request.transformed.url +
                "\n------------------------------------------------------------" +
                "\nRequest headers:\n" +
                JSON.stringify(response.req._headers, undefined, 1) +
                "\nRequest data:\n" +
                requestData +
                "\n------------------------------------------------------------" +
                "\nResponse headers:\n" +
                JSON.stringify(response.headers, undefined, 1) +
                "\nResponse body:\n" + response.body + "\n";

            fs.appendFileSync(filepath, requestString);
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
            log.success(response.statusCode);
        } else {
            ErrorHandler.responseError(response);
        }
        log.notice(" " + response.stats.timeTaken + "ms")
            .normal(" " + request.name + " ")
            .notice("[" + request.method + "] ")
            .light(request.transformed.url + "\n");
    },

    // clears up the set event
    clear: function () {
        this.removeEventListener('requestExecuted', this._bindedOnRequestExecuted);
    }
});

module.exports = AbstractResponseHandler;
