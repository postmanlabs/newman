var jsface       = require('jsface'),
	Globals      = require('./Globals'),
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
	 * @param {Object} response Response we got from Newman.
	 * @param {Object} tests Test Results.
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
				"name": "",       // Fill these guys later on
				"detail": ""	// This guy too.
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
		result = newResultObject;
	},

	_extractPassFailCountFromTests: function(tests) {
		return _und.reduce(_und.keys(tests), function(results, key) {
			results[key] = {
				pass: tests[key] ? 1 : 0,
				fail: tests[key] ? 0 : 1
			};
			return results;
		}, {});
	},

	exportResults: function() {
		var exportVariable = this._createExportVariable();

		if (Globals.outputFile) {
			fs.writeFileSync(path.resolve(Globals.outputFile) , JSON.stringify(exportVariable, null, 4));
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