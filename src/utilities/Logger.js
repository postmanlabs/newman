var jsface = require("jsface"),
	color  = require("cli-color");

/**
 * @name Logger
 * @namespace 
 * @classdef Logger class, used for all logging inside newman
 */
var Logger = jsface.Class({
	$singleton: true,
	success: function(log) {
		console.log(color.green("✔ " + log));
	},
	error: function(log) {
		console.log(color.red("✗ " + log));
	}
});

module.exports = Logger;
