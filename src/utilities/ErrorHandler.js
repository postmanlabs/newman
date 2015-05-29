var jsface = require('jsface'),
	log = require('./Logger'),
	Globals = require('./Globals');

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

	testCaseError: function(err) {
		Globals.exitCode = 1;
		log.error(err);

		if (Globals.stopOnError) {
			terminateWithError(err);
		}
	},

	exceptionError: function(err) {
		Globals.exitCode = 1;
		log.exceptionError(err);

		if (Globals.stopOnError) {
			terminateWithError(err);
		}
	},
	
	terminateWithError: function(msg) {
		log.error(msg+"\n");
		if(Globals.updateMessage) {
			console.log(Globals.updateMessage);
		}
		process.exit(1);
	}
});

module.exports = ErrorHandler;
