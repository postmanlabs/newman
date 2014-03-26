var jsface = require('jsface');

var RequestModel = jsface.Class({
    constructor: function(requestJson) {
        this.id            = requestJson.id;
        this.headers       = requestJson.headers;
        this.url           = requestJson.url;
        this.method        = requestJson.method;
        this.pathVariables = requestJson.pathVariables;
        this.data          = requestJson.data;
        this.dataMode      = requestJson.dataMode;
        this.name          = requestJson.name;
        this.description   = requestJson.description;
        this.responses     = requestJson.responses;
        this.tests         = requestJson.tests;
    },
    toString: function() {
        return "Request: [" + this.method + "]: " + this.url;
    },
    hasTemplate: function() {
        return !(this.url.match(/{\w+}/) === null);
    }
});

module.exports = RequestModel;
