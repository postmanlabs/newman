var jsface  = require("jsface"),
	Helpers = require('./Helpers'),
	util    = require('util'),
	Globals = require('./Globals'),
	color   = require("cli-color");

/**
 * @name Logger
 * @namespace 
 * @classdef Logger class, used for all logging inside newman
 */
var Logger = jsface.Class({
	$singleton: true,

	printMessage: function(msg, colorFunc) {
		if (Globals.monochrome) {
			util.print(msg);
		} else {
			util.print(colorFunc(msg));
		}
	},

	success: function(log) {
		this.printMessage(log, color.green);
		return this;
	},

	error: function(log) {
		this.printMessage(log, color.red);
		return this;
	},

	notice: function(log) {
		this.printMessage(log, color.cyan);
		return this;
	},

	warn: function(log) {
		this.printMessage(log, color.yellow);
		return this;
	},

	normal: function(log) {
		util.print(log);
		return this;
	},

	light: function(log) {
		this.printMessage(log, color.underline.xterm(245));
		return this;
	},

	note: function(log) {
		this.printMessage(log, color.xterm(33));
		return this;
	},

	testCaseSuccess: function(log) {
		if (Globals.monochrome) {
			Helpers.symbols.ok = " PASS ";
		}
		this.success("    " + Helpers.symbols.ok + log + "\n");
		return this;
	},

	testCaseError: function(log) {
		if (Globals.monochrome) {
			Helpers.symbols.err = " FAIL ";
		}
		this.error("    " + Helpers.symbols.err + log + "\n");
		return this;
	},

	throwError: function(msg) {
		var err = new Error(msg);
		this.error(color.red(err.message));
		throw err;
	},

	exceptionError: function(err) {
		this.error("    " + "EXCEPTION - " + err + "\n");
	}
});

module.exports = Logger;
