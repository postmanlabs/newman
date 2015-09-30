var jsface = require('jsface'),
    log = require('../utilities/Logger'),
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
        if (response.statusCode >= 200 && response.statusCode < 300) {
            log.success(response.statusCode);
        } else {
            ErrorHandler.responseError(response);
        }
        
        //Include the folder name as part of the request name if present
        var testName = request.name;
        if (request.folderName) {
            testName = request.folderName + '.' + testName;
        }

        log
            .notice(" " + response.stats.timeTaken + "ms")
            .normal(" " + testName + " ")
            .light(request.transformed.url + "\n");
    },

    // clears up the set event
    clear: function () {
        this.removeEventListener('requestExecuted', this._bindedOnRequestExecuted);
    }
});

module.exports = AbstractResponseHandler;
