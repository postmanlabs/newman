// Set of prilimnary tests for newman
var assert = require('assert'),
	sinon  = require('sinon'),
	jsface = require('jsface');


var RequestRunner = require('../src/runners/RequestRunner.js');

// Mocked Classes
var MockedRequestRunner = jsface.Class(RequestRunner, {
	constructor: function(request) {
		this.$class.$super.call(this, request);
	},
	execute: function() {
		return true;
	}
});

module.exports = MockedRequestRunner;
