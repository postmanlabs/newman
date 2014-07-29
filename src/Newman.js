var jsface          = require("jsface"),
    //Validator       = require("postman_validator"),
    IterationRunner = require("./runners/IterationRunner"),
    EventEmitter     = require('./utilities/EventEmitter'),
    Errors           = require('./utilities/ErrorHandler'),
    Globals          = require('./utilities/Globals'),
    Options          = require('./utilities/Options');

/**
 * @name Newman
 * @classdesc Bootstrap Newman class, mixin from Options class
 * @namespace
 */
var Newman = jsface.Class([Options, EventEmitter], {
    $singleton: true,

    /**
     * Executes XHR Requests for the Postman request, and logs the responses
     * & runs tests on them.
     * @param  {JSON} requestJSON Takes the Postman Collection JSON from a file or url.
     * @memberOf Newman
     * @param {object} Newman options
     */
    execute: function(requestJSON, options, callback) {
        // var collectionParseError = Validator.validateJSON('c',requestJSON);
        // if(!collectionParseError.status) {
        //     Errors.terminateWithError("Not a valid POSTMAN collection");
        // }

        // if(options.envJson) {
        //     var envParseError = Validator.validateJSON('e',options.envJson);
        //     if(!envParseError.status) {
        //         Errors.terminateWithError("Not a valid POSTMAN environment");
        //     }
        // }

        // if(options.globalJSON) {
        //     var globalParseError = Validator.validateJSON('g',options.globalJSON);
        //     if(!globalParseError.status) {
        //         Errors.terminateWithError("Not a valid POSTMAN globals file");
        //     }
        // }

        Globals.addEnvironmentGlobals(requestJSON, options);
        this.setOptions(options);

        if (typeof callback === "function") {
            this.addEventListener('iterationRunnerOver', callback);
        }

        // setup the iteration runner with requestJSON passed and options
        this.iterationRunner = new IterationRunner(requestJSON, this.getOptions());

        this.iterationRunner.execute();
    }
});

module.exports = Newman;
