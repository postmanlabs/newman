var jsface = require('jsface'),
    ParentModel = require('./ParentModel.js');

/**
 * @class RequestModel
 * @classdef Request class that inherits from ParentModel representing
 * a postman request object.
 * @param requestJson {JSON} Takes the Postman Request JSON as the input.
 * @extends ParentModel
 */
var RequestModel = jsface.Class(ParentModel, {
    constructor: function (requestJson) {
        this.$class.$super.call(this, requestJson);
        this.headers = requestJson.headers;
        this.url = requestJson.url;
        this.method = requestJson.method;
        this.pathVariables = requestJson.pathVariables;
        this.data = requestJson.data;
        this.rawModeData = requestJson.rawModeData;
        this.dataMode = requestJson.dataMode;
        this.responses = requestJson.responses;
        this.tests = requestJson.tests;
        this.preRequestScript = requestJson.preRequestScript;
        this.currentHelper = requestJson.currentHelper;
        this.helperAttributes = requestJson.helperAttributes;
    },
    toString: function () {
        return "Request: [" + this.method + "]: " + this.url;
    },
    /**
     * Function that returns a boolean to indicate if the url has template
     * @memberOf RequestModel
     * @return {Boolean}
     */
    hasTemplate: function () {
        return this.url.match(/{\w+}/) !== null;
    }
});

module.exports = RequestModel;
