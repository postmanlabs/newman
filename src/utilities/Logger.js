var jsface  = require("jsface"),
	Symbols = require('./Symbols'),
	Globals = require('./Globals'),
	EventEmitter     = require('../utilities/EventEmitter'),
	color   = require("cli-color"),
	ansiTrim = require("cli-color/lib/trim");

/**
 * @name Logger
 * @namespace 
 * @classdef Logger class, used for all logging inside newman
 */
var Logger = jsface.Class([EventEmitter], {
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
		this.success("    " + Symbols.symbols.ok + log + "\n");
		return this;
	},

	testCaseError: function(log) {
		this.error("    " + Symbols.symbols.err + log + "\n");
		if (Globals.stopOnError) {
			if(Globals.asLibrary) {
				this.emit('iterationRunnerOver',1);
			}
			else {
				process.exit(1);
			}
		}
		else {
			Globals.exitCode=1;
		}
		return this;
	},

	throwError: function(msg) {
		var err = new Error(msg);
		this.error(err.message);
		throw err;
	},

	exceptionError: function(err) {
		this.error("    " + "EXCEPTION - " + err + "\n");
		if (Globals.stopOnError) {
			if(Globals.asLibrary) {
				this.emit('iterationRunnerOver',1);
			}
			else {
				process.exit(1);
			}
		}
		else {
			Globals.exitCode=1;
		}
	}
});

module.exports = Logger;
