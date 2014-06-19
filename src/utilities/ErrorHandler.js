var jsface = require('jsface'),
	log = require('./Logger');

/**
 * @name ErrorHandler
 * Error Handler class for Newman
 */
var ErrorHandler = jsface.Class({
	$singleton: true,

	requestError: function(request, error) {
		log.error("RequestError: " + request.id + " terminated. Error: " + error.code + "\n");
	},

	responseError: function(response) {
		log.error(response.statusCode);
	},

	parseError: function(msg) {
		log.error("ParseError: " + msg);
	},

	testCaseError: function(testcase) {
		log.testCaseError(testcase);
	},

	exceptionError: function(err) {
		log.exceptionError(err);
	},
	
	terminateWithError: function(msg) {
		log.error(msg+"\n");
		process.exit(1);
	}
});

module.exports = ErrorHandler;
