var jsface = require('jsface'),
	log    = require('../utilities/Logger'),
	_und   = require('underscore');

/**
 * @class TestResponseHandler
 * @classdesc 
 */
var TestResponseHandler = jsface.Class({
	$singleton: true,

	execute: function(request, response) {
		this.request = request;
		this.response = response;
		this.tests = this.getTestResults();
		this._logTestResults(this.tests);
	},

	_hasTestCases: function() {
		return (this.request.tests !== undefined);
	},

	_getValidTestCases: function() {
		var testCases = this.request.tests.split(';');
		var tests = [];
		_und.each(testCases, function(testCase) {
			var t = testCase.trim();
			if (t.length > 0) {
				tests.push(t);
			}
		});
		return tests;
	},

	getTestResults: function() {
		var tests = {}
		var testCases = this._getValidTestCases();
		_und.each(testCases, function(testCase) {
			_und.extend(tests, this._evalutate(testCase));
		}, this);
		return tests;
	},

	_evalutate: function(testCase) {
		// sets the environment
		var tests = {};
		var responseCode = this.response.statusCode;
		var responseHeaders = this.response.headers;
		var responseTime = parseInt(this.response.stats.timeTaken);
		
		// call eval
		eval(testCase);
		return tests;
	},

	_logTestResults: function(tests) {
		_und.each(_und.keys(tests), function(key) {
			if (tests[key]) {
				log.success(key);
			} else {
				log.error(key);
			}
		});
	}
});

module.exports = TestResponseHandler;
