var jsface  = require('jsface'),
	request = require('ahr2'),
	log     = require('../utilities/Logger');

/**
 * @class RequestRunner
 * @classdesc RequestRunner is a singleton object which fires the XHR and takes the
 * appropriate action on the response.
 */
var RequestRunner = jsface.Class({
	$singleton: true,
	/**
	 * @function
	 * @memberOf RequestRunner
	 * @param {RequestModel} request Takes a RequestModel Object.
	 */
	execute: function(request) {
		/* The request is made using AHR here
		 * Steps before the XHR call - 
		 * - Do variable replacement
		 * - get XHR headers
		 * - set the request method
		 * - set a response timeout?
		 * - return success or failure
		 * - what else?
		 */
		log.success("Running:" + request.url);
	}
});

module.exports = RequestRunner;
