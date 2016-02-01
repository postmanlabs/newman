var jsface = require('jsface');

/**
 * @class RequestModel
 * @classdef Request class that inherits from ParentModel representing
 * a postman request object.
 * @param requestJson {JSON} Takes the Postman Request JSON as the input.
 * @extends ParentModel
 */
var ResultSummaryModel = jsface.Class({
    constructor: function (summary) {
        this.type = summary.type;
        this.parentId = summary.parentId;
        this.parentName = summary.parentName;
        this.passCount = summary.passCount;
        this.failCount = summary.failCount;
    },
});

module.exports = ResultSummaryModel;
