var jsface  = require("jsface"),
	Helpers = require('./Symbols'),
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

	_printMessage: function(string, colorFunc) {
		if (Globals.noColor) {
			string = ansiTrim(colorFunc(string));
		} else {
			string = colorFunc(string);
		}
		process.stdout.write(string);
	},

	success: function(log) {
		this._printMessage(log, color.green);
		return this;
	},

	error: function(log) {
		this._printMessage(log, color.red);
		return this;
	},

	notice: function(log) {
		this._printMessage(log, color.cyan);
		return this;
	},

	warn: function(log) {
		this._printMessage(log, color.yellow);
		return this;
	},

	normal: function(log) {
		this._printMessage(log, color.white);
		return this;
	},

	light: function(log) {
		this._printMessage(log, color.underline.xterm(245));
		return this;
	},

	note: function(log) {
		this._printMessage(log, color.underline.xterm(33));
		return this;
	},

	testCaseSuccess: function(log) {
		this.success("    " + Helpers.symbols.ok + log + "\n");
		return this;
	},

	testCaseError: function(log) {
		this.error("    " + Helpers.symbols.err + log + "\n");
		return this;
	},

	throwError: function(msg) {
		var err = new Error(msg);
		this.error(err.message);
		throw err;
	},

	exceptionError: function(err) {
		this.error("    " + "EXCEPTION - " + err + "\n");
	}
});

module.exports = Logger;
