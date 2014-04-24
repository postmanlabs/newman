var jsface = require('jsface'),
	fs     = require('fs'),
	Errors = require('./ErrorHandler');

/** 
 * @name Helpers
 * @namespace
 * @classdesc Helper class with useful methods used throughout Newman
 */
var Helpers = jsface.Class({
    $singleton: true,
    /**
     * @function
     * @memberOf Helpers
     * @param  {String}  url [Takes a URL as an input]
     * @return {Boolean}     [Returns is the url is valid or not.]
     */
    validateCollectionUrl: function(url) {
		var result = url.match(/(https|http):\/\/([_a-z\d\-]+(\.[_a-z\d\-]+)+)(([_a-z\d\-\\\.\/]+[_a-z\d\-\\\/])+)*/);
		if (!result)  {
			Errors.terminateWithError("Please specify a valid URL");
		}
    },

	validateDataFile: function(file) {
		if (!fs.existsSync(file)) {
			Errors.terminateWithError("The data file passed is not a valid json / csv file");
		}
	},

	validateCollectionFile: function(file) {
		if (!fs.existsSync(file)) {
			Errors.terminateWithError("Please specify a Postman Collection either as a file or a URL");
		}
	}
});

module.exports = Helpers;
