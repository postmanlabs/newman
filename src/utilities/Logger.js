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
		process.stdout.write(color.green("✔ " + log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs errors.
	 * @memberOf Logger
	 */
	error: function(log) {
		process.stdout.write(color.red("✗ " + log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs notice messages.
	 * @memberOf Logger
	 */
	notice: function(log) {
		process.stdout.write(color.cyan(log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs warning messages.
	 * @memberOf Logger
	 */
	warn: function(log) {
		process.stdout.write(color.yellow(log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs normal messages.
	 * @memberOf Logger
	 */
	normal: function(log) {
		process.stdout.write(color.black(log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs light grey messages.
	 * @memberOf Logger
	 */
	light: function(log) {
		process.stdout.write(color.xterm(245)(log));
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a node error in red
	 * @memberOf Logger
	 */
	throwError: function(msg) {
		var err = new Error(msg);
		process.stdout.write(color.red(err.message));
	}
});

module.exports = Logger;
