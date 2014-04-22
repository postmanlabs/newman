var jsface           = require("jsface"),
	Options          = require('../utilities/Options'),
	log              = require('../utilities/Logger'),
	EventEmitter     = require('../utilities/EventEmitter'),
	CollectionRunner = require("../runners/CollectionRunner"),
	ResponseExporter = require("../utilities/ResponseExporter");

/**
 * @class IterationRunner
 * @param CollectionJson {JSON} Takes a JSON as the input
 * @param Options {JSON} Set of options to pass to the collection runner
 * @param numOfIterations {int} Number of times the iteration has to run
 */
var IterationRunner = jsface.Class([Options, EventEmitter], {
	constructor: function(collection, options) {
		this.setOptions(options);
		this.numOfIterations = this.getOptions().iterationCount || 1;
		this.collection = collection || [];
		this.iteration = 1;

		// run the next iteration when the collection run is over
		this.addEventListener('collectionRunnerOver', this._runNextIteration.bind(this));
		this.addEventListener('iterationRunnerOver', this._exportResponses.bind(this));
	},

	// logs the iteration count
	_logStatus: function() {
		log.note("\nIteration " + this.iteration + " of " + this.numOfIterations + "\n");
	},

	// runs the next iteration
	_runNextIteration: function() {
		if (this.iteration <= this.numOfIterations) {
			this._logStatus();
			var runner = new CollectionRunner(this.collection, this.getOptions());
			runner.execute();
			this.iteration++;
		} else {
			this.emit('iterationRunnerOver');
		}
	},

	_exportResponses: function() {
		ResponseExporter.exportResults();
	},

	/**
	 * Runs the iteration. Instatiates a new CollectionRunner and executes it
	 */
	execute: function() {
		this._runNextIteration();
	}
});

module.exports = IterationRunner;
