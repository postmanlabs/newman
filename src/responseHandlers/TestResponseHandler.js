var jsface = require('jsface'),
	log    = require('../utilities/Logger');

/**
 * @class TestResponseHandler
 * @classdesc 
 */
var TestResponseHandler = jsface.Class({
	$singleton: true,

	execute: function(request, response) {
		this.request = request;
		this.response = response;
	},

	_hasTestcases: function() {
		return (this.request.tests !== undefined);
	}

});

module.exports = TestResponseHandler;
