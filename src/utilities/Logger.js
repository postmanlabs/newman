var jsface  = require("jsface"),
	Helpers = require('./Helpers'),
	Globals = require('./Globals'),
	color   = require("cli-color"),
	ansiTrim = require("cli-color/lib/trim");

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
		process.stdout.write(this._parseANSIStringsOnUserOption(color.green(log)));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs errors.
	 * @memberOf Logger
	 */
	error: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption(color.red(log)));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs notice messages.
	 * @memberOf Logger
	 */
	notice: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption(color.cyan(log)));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs warning messages.
	 * @memberOf Logger
	 */
	warn: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption(color.yellow(log)));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs normal messages.
	 * @memberOf Logger
	 */
	normal: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption(log));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs light grey messages.
	 * @memberOf Logger
	 */
	light: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption(color.underline.xterm(245)(log)));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs orange notes.
	 * @memberOf Logger
	 */
	note: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption(color.xterm(33)(log)));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a test case success
	 * @memberOf Logger
	 */
	testCaseSuccess: function(log) {
		this.success(this._parseANSIStringsOnUserOption("    " + color.green(Helpers.symbols.ok + log) + "\n"));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a test case error
	 * @memberOf Logger
	 */
	testCaseError: function(log) {
		process.stdout.write(this._parseANSIStringsOnUserOption("    " + color.red(Helpers.symbols.err + log) + "\n"));
		return this;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a node error in red
	 * @memberOf Logger
	 */
	throwError: function(msg) {
		var err = new Error(msg);
		this.error(	(color.red(err.message)));
		throw err;
	},
	/**
	 * Logger Method
	 * @param  {String} log Logs a node exception error in red
	 * @memberOf Logger
	 */
	exceptionError: function(err) {
		this.error(this._parseANSIStringsOnUserOption("    " + color.bold.red("EXCEPTION - " + err) + "\n"));
	},

	_parseANSIStringsOnUserOption: function(string) {
		if (Globals.noColor) {
			string = ansiTrim(string);
		}
		return string;
	}
});

module.exports = Logger;
