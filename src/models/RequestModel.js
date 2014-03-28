var jsface = require('jsface'),
    ParentModel = require('./ParentModel.js');

var RequestModel = jsface.Class(ParentModel, {
    constructor: function(requestJson) {
        this.$class.$super.call(this, requestJson);
        this.headers       = requestJson.headers;
        this.url           = requestJson.url;
        this.method        = requestJson.method;
        this.pathVariables = requestJson.pathVariables;
        this.data          = requestJson.data;
        this.dataMode      = requestJson.dataMode;
        this.responses     = requestJson.responses;
        this.tests         = requestJson.tests;
    },
    toString: function() {
        return "Request: [" + this.method + "]: " + this.url;
    },
    hasTemplate: function() {
        return this.url.match(/{\w+}/) !== null;
    },
    execute: function() {
        /* The request is made using AHR here
         * Steps before the XHR call - 
         * - Do variable replacement
         * - get XHR headers
         * - set the request method
         * - set a response timeout?
         * - return success or failure
         * - what else?
         */
        console.log("Running:", this.url);
    }
});

module.exports = RequestModel;
