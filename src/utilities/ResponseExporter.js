var jsface       = require('jsface'),
	Globals      = require('./Globals'),
	log          = require('./Logger'),
	_und         = require('underscore'),
	path         = require('path'),
	fs           = require('fs');

/**
 * @class ResponseExporter
 * @classdesc Class Used for exporting the generated responses.
 */
var ResponseExporter = jsface.Class({
	$singleton: true,

	_results: [],

	/**
	 * Adds the Reponse to the Result Array.
	 * @param {Object} request Request we got from Newman.
	 * @param {Object} response Response we got from Newman.
	 * @param {Object} tests Test Results.
	 * @memberOf ResponseExporter
	 */
	addResult: function(request, response, tests) {
		var result = this._findResultObject(request);
		if (result) {
			this._appendToResultsObject(result, request, response, tests);
		} else {
			result = this._createResultObject(request, response, tests);
			this._results.push(result);
		}
	},

	// Used to create a first result object, to be used while exporting the results.
	_createResultObject: function(request, response, tests) {
		if (!tests) {
			tests = {};
		}

		return {
			"id": request.id,
			"name": request.name,
			"url": request.url,
			"totalTime": response.stats.timeTaken,
			"responseCode": {
				"code": response.statusCode,
				"name": "",       // TODO: Fill these guys later on
				"detail": ""
			},
			"tests": tests,
			"testPassFailCounts": this._extractPassFailCountFromTests(tests),
			"times": [],			// Not sure what to do with this guy
			"allTests": [tests],
			"time": response.stats.timeTaken
		};
	},

	_findResultObject: function(request) {
		return _und.find(this._results, function(result) {
			return result.id === request.id;
		}) || null;
	},

	_appendToResultsObject: function(result, request, response, tests) {
		var newResultObject = this._createResultObject(request, response, tests);
		newResultObject.totalTime += result.totalTime;
		newResultObject.allTests = newResultObject.allTests.concat(result.allTests);
		this._results[this._results.indexOf(result)] = newResultObject;
	},

	// Creates a pass, fail object for a given test.
	_extractPassFailCountFromTests: function(tests) {
		return _und.reduce(_und.keys(tests), function(results, key) {
			results[key] = {
				pass: tests[key] ? 1 : 0,
				fail: tests[key] ? 0 : 1
			};
			return results;
		}, {});
	},

	/**
	 * This function when called creates a file with the JSON of the results.
	 * @memberOf ResponseExporter
	 */
	exportResults: function() {
		var exportVariable = this._createExportVariable();

		if (Globals.outputFile) {
			var filepath = path.resolve(Globals.outputFile);
			fs.writeFileSync(filepath , JSON.stringify(exportVariable, null, 4));
			log.note("\n\n Output Log: " + filepath + "\n");
		}
	},

	_createExportVariable: function() {
		var exportObject = Globals.requestJSON;
		exportObject.environment = Globals.envJson;
		exportObject.globals = Globals.globalJSON;
		exportObject.results = this._results;
		return exportObject;
	}
});

module.exports = ResponseExporter;
