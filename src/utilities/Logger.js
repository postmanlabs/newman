var jsface = require("jsface"),
	color  = require("cli-color");

/**
 * Logger Class, used for logging.
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