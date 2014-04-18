var jsface           = require("jsface"),
	Options          = require('../utilities/Options'),
	log              = require('../utilities/Logger'),
	EventEmitter     = require('../utilities/EventEmitter'),
	CollectionRunner = require("../runners/CollectionRunner");

/**
 * @class IterationRunner
 * @param CollectionJson {JSON} Takes a JSON as the input
 * @param Options {JSON} Set of options to pass to the collection runner
 * @param maxCount {int} Number of times the iteration has to run
 */
var IterationRunner = jsface.Class([Options, EventEmitter], {
	constructor: function(collection, options, maxCount) {
		this.setOptions(options);
		this.maxCount = maxCount;
		this.collection = collection || [];
		this.iteration = 1;

		// run the next iteration when the collection run is over
		this.addEventListener('collectionRunnerOver', this._runNextIteration.bind(this));
	},

	// logs the iteration count
	_logStatus: function() {
		log.note("\nIteration " + this.iteration + " of " + this.maxCount + "\n");
	},

	// runs the next iteration
	_runNextIteration: function() {
		if (this.iteration <= this.maxCount) {
			this._logStatus();
			var runner = new CollectionRunner(this.collection, this.getOptions());
			runner.execute();
			this.iteration += 1;
		}
	},

	/**
	 * Runs the iteration. Instatiates a new CollectionRunner and 
	 * executes it
	 */
	execute: function() {
		this._runNextIteration();
	}
});

module.exports = IterationRunner;
