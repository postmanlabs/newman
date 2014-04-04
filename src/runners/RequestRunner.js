var jsface  = require('jsface'),
	unirest = require('unirest'),
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

		unirest.request({
			url: request.url,
			method: request.method,
			headers: this._generateHeaders(request.headers),
			body: this._setData(request)
		}, function(error, response, body) {
				if (error) {
					log.error(request.id + " terminated with the error " + error.code);
				} else {
					log.success(request.url + " succeded with response.");
				}
		});
	},

	_setData: function(request) {
		var data = '';
		if (request.dataMode === "raw") {
			data = request.data;
		} else if (request.dataMode === "params") {
			request.data.forEach(function(obj) {
				Object.keys(obj).forEach(function(key) {
					data[key] = obj[key];
				});
			});
			data = JSON.stringify(data);
		}
		return data;
	},

	_generateHeaders: function(headers) {
		var headerObj = {};
		headers.split('\n').forEach(function(str) {
			if (str) {
				var splitIndex = str.indexOf(':');
				headerObj[str.substr(0,splitIndex)] = str.substr(splitIndex + 1).trim();
			}
		});
		return headerObj;
	}
});

module.exports = RequestRunner;
