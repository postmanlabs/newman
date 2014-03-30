var jsface  = require('jsface'),
	request = require('ahr2'),
	log     = require('../utilities/Logger');

/**
 * @class RequestRunner
 * @classdesc RequestRunner is the class which fires the XHR and takes the
 * appropriate action on the response.
 * @param {RequestModel} request Takes a RequestModel Object.
 */
var RequestRunner = jsface.Class({
	constructor: function(request) {
		this.request = request;
	},
	/**
	 * @function
	 * @memberOf RequestRunner
	 */
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
		log.success("Running:" + this.request.url);
	}
});

module.exports = RequestRunner;
