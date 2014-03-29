var jsface = require("jsface"),
	color  = require("cli-color");

/**
 * @name Logger
 * @namespace 
 * @classdef Logger class, used for all logging inside newman
 */
var Logger = jsface.Class({
	$singleton: true,
	/**
	 * Logger Method
	 * @param  {String} log Logs success.
	 * @memberOf Logger
	 */
	success: function(log) {
		console.log(color.green("✔ " + log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs errors.
	 * @memberOf Logger
	 */
	error: function(log) {
		console.log(color.red("✗ " + log));
	}
});

module.exports = Logger;
