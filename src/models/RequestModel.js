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
	constructor: function(requestJson) {
		this.$class.$super.call(this, requestJson);
		this.headers       = requestJson.headers;
		this.url           = requestJson.url;
		this.method        = requestJson.method;
		this.pathVariables = requestJson.pathVariables;
		this.data          = requestJson.data;
		this.rawModeData   = requestJson.rawModeData;
		this.dataMode      = requestJson.dataMode;
		this.responses     = requestJson.responses;
		this.tests         = requestJson.tests;
		this.preRequestScript     = requestJson.preRequestScript;
		this.currentHelper = requestJson.currentHelper;
		this.helperAttributes = requestJson.helperAttributes;
        
        if (requestJson.tests && requestJson.tests.startsWith('file:')) {
            var fileName = requestJson.tests.substring(5);
            console.log('Reading in tests from file:%s', fileName);

            try {
                this.tests = fs.readFileSync(fileName, 'utf8');
                //console.log('tests:\n\r', this.tests);
            } catch (e) {
                if (e.code === 'ENOENT') {
                    console.log('File not found!');
                    //leave tests as they were this will no dobut cause an exception inthe newman process but will be 
                    //reported back to user
                    this.tests = requestJson.tests;
                } else {
                    throw e;
                }
            }
        } else {
            this.tests = requestJson.tests;
        }

        
        if (requestJson.rawModeData && requestJson.rawModeData.startsWith('file:')) {
            var fileName = requestJson.rawModeData.substring(5);
            console.log('Reading in rawModeData from file:%s', fileName);

            try {
                this.rawModeData = fs.readFileSync(fileName, 'utf8');
                //console.log('tests:\n\r', this.tests);
            } catch (e) {
                if (e.code === 'ENOENT') {
                    console.log('File not found!');
                    //leave tests as they were this will no dobut cause an exception inthe newman process but will be 
                    //reported back to user
                    this.rawModeData = requestJson.rawModeData;
                } else {
                    throw e;
                }
            }
        } else {
            this.rawModeData = requestJson.rawModeData;
        }          
        
	},
	toString: function() {
		return "Request: [" + this.method + "]: " + this.url;
	},
	/**
	 * Function that returns a boolean to indicate if the url has template
	 * @memberOf RequestModel
	 * @return {Boolean}
	 */
	hasTemplate: function() {
		return this.url.match(/{\w+}/) !== null;
	}
});

module.exports = RequestModel;
