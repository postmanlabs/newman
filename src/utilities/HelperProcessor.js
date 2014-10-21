var jsface = require('jsface'),
	fs     = require('fs'),
	Errors = require('./ErrorHandler'),
	CryptoJS = require('crypto-js'),
	_und   = require('underscore');

/**
 * @name Helpers
 * @namespace
 * @classdesc Helper class to use Auth Helpers
 */
var HelperProcessor = jsface.Class({
	$singleton: true,

	_useAuthHelpers: function(request) {
		if(request.currentHelper==="normal") {
			return;
		}
		else if(request.currentHelper==="basicAuth") {
			this._useBasicAuth(request);
		}
		else if(request.currentHelper==="digestAuth") {
			this._useBasicAuth(request);
		}
		else if(request.currentHelper==="oAuth1") {
			this._useBasicAuth(request);
		}
	},

	_useBasicAuth: function(request) {
		var authHeaderKey = "Authorization";
		var username = request.transformed.helperAttributes.username;
		var password = request.transformed.helperAttributes.password;

		var rawString = username + ":" + password;
		var encodedString = "Basic " + btoa(rawString);

		var headerObj = Helpers.generateHeaderObj(request.transformed.headers);
		headerObj[authHeaderKey] = encodedString;
		var headerString = Helpers.generateHeaderStringFromObj(headerObj);
		request.transformed.headers = headerString;
	},

	_useDigestAuth: function(request) {
		var authHeaderKey = "Authorization";
		var helperAttrs = request.transformed.helperAttributes;


		var algorithm = helperAttrs.algorithm;

		var username = helperAttrs.username;
		var realm = helperAttrs.realm;
		var password = helperAttrs.password;

		var method = request.method;

		var nonce = helperAttrs.nonce;
		var nonceCount = helperAttrs.nonceCount;
		var clientNonce = helperAttrs.clientNonce;

		var opaque = helperAttrs.opaque;
		var qop = helperAttrs.qop;
		var body = this._getRequestBody(request);
		var url = request.processUrl(request.get("url"));

		var urlParts = request.splitUrlIntoHostAndPath(url);

		var digestUri = urlParts.path;
	},

	_getRequestBody: function(request) {
		if(request.dataMode==="urlencoded") {
			console.log(request.transformed.data);
		}
		else if(request.dataMode==="params") {
			console.log("Problem - what do we do for the separator? :S");
			console.log(request.transformed.data);
		}
		else if(request.dataMode==="raw") {
			console.log("Raw");
			var dataToSend = this.htmlEscape(request.data);
			console.log(dataToSend);
		}
		return "";
	},

	htmlEscape: function (str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

});

module.exports = HelperProcessor;
