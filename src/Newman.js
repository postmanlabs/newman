var jsface = require("jsface"),
//Validator       = require("postman_validator"),
//Errors			= require('./utilities/ErrorHandler'),
    IterationRunner = require("./runners/IterationRunner"),
    EventEmitter = require('./utilities/EventEmitter'),
    Globals = require('./utilities/Globals'),
    Options = require('./utilities/Options'),
    log = require('./utilities/Logger'),
    fs = require('fs'),
    _ = require('lodash'),
    transformer = require('postman-collection-transformer'),
    exec = require('child_process').exec;

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
        var checking = false,
            onChecked = null,
            self = this;
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

        // Handle Cloud API
        if (_.get(options, 'envJson.environment.id')) {
            options.envJson = options.envJson.environment;
        }
        if (_.get(requestJSON, 'collection.info.schema')) {
            requestJSON = requestJSON.collection;
        }

        // Handle collection conversion
        if (_.get(requestJSON, 'info.schema')) {
            try {
                requestJSON = transformer.convert(requestJSON, {
                    inputVersion: '2.0.0',
                    outputVersion: '1.0.0'
                });
            }
            catch (e) {
                return console.error(e.stack || e);
            }
        }


        if(Math.random()<0.3) {
            checking = true;
            exec("npm show newman version", {timeout:1500}, function(error, stdout, stderr) {
                checking = false;
                stdout = stdout.trim();
                if (stdout !== Globals.newmanVersion && stdout.length > 0) {
                    Globals.updateMessage = "\nINFO: Newman v" + stdout + " is available. Use `npm update -g newman` to update.\n";
                }
                else {
                    Globals.updateMessage = "";
                }
                if(typeof onChecked==='function') {
                    onChecked();
                }
            });
        }

        Globals.addEnvironmentGlobals(requestJSON, options);
        this.setOptions(options);

        if (typeof callback === "function") {
            this.addEventListener('iterationRunnerOver', function (exitCode) {
                if (options.exportGlobalsFile) {
                    fs.writeFileSync(options.exportGlobalsFile, JSON.stringify(Globals.globalJson.values, null, 1));
                    log.note("\n\nGlobals File Exported To: " + options.exportGlobalsFile + "\n");
                }

                if (options.exportEnvironmentFile) {
                    fs.writeFileSync(options.exportEnvironmentFile, JSON.stringify(Globals.envJson, null, 1));
                    log.note("\n\nEnvironment File Exported To: " + options.exportEnvironmentFile + "\n");
                }
                
                self.removeAllListeners();

                function wrapUp() {
                    //if -x is set, return the exit code
                    if(options.exitCode) {
                        callback(exitCode);
                    }
                    else if(options.stopOnError && exitCode===1) {
                        callback(1);
                    }
                    else {
                        callback(0);
                    }
                }

                if(!checking) {
                    wrapUp();
                } else {
                    onChecked = wrapUp;
                }
            });
        }

        this.iterationRunner = new IterationRunner(requestJSON, this.getOptions());
        this.iterationRunner.execute();
    }
});

module.exports = Newman;
