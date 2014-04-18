var jsface           = require("jsface"),
	Options          = require('../utilities/Options'),
	log              = require('../utilities/Logger'),
	CollectionRunner = require("../runners/CollectionRunner");

/**
 * @class IterationRunner
 * @param CollectionJson {JSON} Takes a JSON as the input
 * @param Options {JSON} Set of options to pass to the collection runner
 */
var IterationRunner = jsface.Class([Options], {
	constructor: function(collection, options, maxCount) {
		this.setOptions(options);
		this.maxCount = maxCount;
		this.collection = collection || [];
	},

	logStatus: function(count) {
		var index = this.maxCount - count;
		log.note("\nIteration " + index + " of " + this.maxCount + "\n");
	},

	execute: function(count) {
		this.logStatus(count);
		var runner = new CollectionRunner(this.collection, this.getOptions());
		runner.execute();
	}
});

module.exports = IterationRunner;
