var jsface          = require("jsface"),
    //Validator       = require("postman_validator"),
	//Errors			= require('./utilities/ErrorHandler'),
    IterationRunner = require("./runners/IterationRunner"),
    EventEmitter     = require('./utilities/EventEmitter'),
    Globals          = require('./utilities/Globals'),
    Options          = require('./utilities/Options'),
    log              = require('./utilities/Logger'),
    fs               = require('fs'),
    exec             = require('child_process').exec;

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
        if(Math.random()<0.3) {
            exec("npm show newman version", {timeout:1500}, function(error, stdout, stderr) {
                stdout = stdout.trim();
                if(stdout!==Globals.newmanVersion && stdout.length>0) {
                    Globals.updateMessage = "\nINFO: Newman v" + stdout+" is available. Use `npm update -g newman` to update.\n";
                }
                else {
                    Globals.updateMessage = "";
                }
            });
        }

        Globals.addEnvironmentGlobals(requestJSON, options);
        this.setOptions(options);

        if (typeof callback === "function") {
            this.addEventListener('iterationRunnerOver', function(exitCode) {
                if (options.exportGlobalsFile) {
                    fs.writeFileSync(options.exportGlobalsFile, JSON.stringify(Globals.globalJson.values,null,1));
                    log.note("\n\nGlobals File Exported To: " + options.exportGlobalsFile + "\n");
                }

                if (options.exportEnvironmentFile) {
                    fs.writeFileSync(options.exportEnvironmentFile, JSON.stringify(Globals.envJson,null,1));
                    log.note("\n\nEnvironment File Exported To: " + options.exportEnvironmentFile + "\n");
                }

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
            });
        }

        // setup the iteration runner with requestJSON passed and options
        this.iterationRunner = new IterationRunner(requestJSON, this.getOptions());

 if (options.exportJSON) {

            var changes = false;

            var collectionName = requestJSON.name.replace(/ /g, '');
            requestJSON.name = collectionName;

            _und.each(requestJSON.folders, function (folder) {

                var folderItemName = folder.name.replace(/ /g, '')
                if (folderItemName != folder.name) {
                    changes = true;
                    folder.name = folderItemName;
                }
            });

            if (changes) {
                console.log('updated fodler names');
                this.iterationRunner = new IterationRunner(requestJSON, this.getOptions());
            }

            //Get a ordered list of all the requests
            var orderedCollection = this.iterationRunner._getOrderedCollection(requestJSON);


            _und.each(orderedCollection, function (postmanRequest) {
                var fileName

                //Remove spaces from Request Name
                var requestItem = _und.find(requestJSON.requests, function (request) {
                    return request.id === postmanRequest.id;
                });

                requestItem.name = postmanRequest.name.replace(/ /g, '')
                if (requestItem.name != postmanRequest.name) {
                    changes = true;
                }

                //Add folder name to path if it exists
                if (postmanRequest.folderName) {
                    console.log('Request:%s.%s with ID:%s', postmanRequest.folderName, requestItem.name, postmanRequest.id);
                    fileName = postmanRequest.folderName + '.' + requestItem.name;

                } else {
                    console.log('no folder name');
                    console.log('Request:%s with ID:%s', postmanRequest.name, postmanRequest.id);
                    fileName = requestItem.name;
                }

                //build a base file name for data output
                baseFileName = path.join(options.exportJSON, fileName);

                if (requestItem.tests) {
                    //build a file name for the test data output
                    var testsDatafileName = baseFileName + '.tests.json';

                    var testsJSON = requestItem.tests
                        //write out the info
                    fs.writeFileSync(testsDatafileName, testsJSON);
                    console.log('dump tests to file: %s', testsDatafileName);
                    requestItem.tests = 'file:' + testsDatafileName;
                }


                if (requestItem.rawModeData) {
                    var rawModeDatafileName = baseFileName + '.rawModeData.json';
                    var rawModeData = requestItem.rawModeData
                        //write out the info
                    fs.writeFileSync(rawModeDatafileName, rawModeData);
                    console.log('dump rawModeData to file: %s', rawModeDatafileName);
                    requestItem.rawModeData = 'file:' + rawModeDatafileName;
                }


            }, this);

            if (changes) {
                var collectionFileName = path.join(options.exportJSON, collectionName + '.colleciton.json');
                fs.writeFileSync(collectionFileName, JSON.stringify(requestJSON, null, 1));
                console.log('done something');
            }

        } 
        else if (options.importJSON) {

            /*take the path supplied and make a single output file which is a postman collection
            
               find the file name of colelction it is in the new options.collectionFileName
            
               replace the file: refereces with the actual contents of the file for
                    tests
                    rawModeData
                    
                write a new output file 
            */
            
            console.log('options.collectionFileName:', options.collectionFileName);

            var changes = false;
 
            //Get a ordered list of all the requests
            var orderedCollection = this.iterationRunner._getOrderedCollection(requestJSON);

            _und.each(orderedCollection, function (postmanRequest) {

                var fileName

                //get the single request item
                var requestItem = _und.find(requestJSON.requests, function (request) {
                    return request.id === postmanRequest.id;
                });

                console.log('processing request :%s, tests:%s', requestItem.name,requestItem.tests);
                
                    

                //take a file reference and convert to postman
                if (requestItem.tests && requestItem.tests.startsWith('file:')) {
                    var fileName = requestItem.tests.substring(5);
                    console.log('Reading in tests from file:%s', fileName);

                    try {
                        requestItem.tests = fs.readFileSync(fileName, 'utf8');
                        changes =true;
                    } catch (e) {
                        if (e.code === 'ENOENT') {
                            console.log('File not found!');
                        } else {
                            throw e;
                        }
                    }
                } 

                //take a file reference and convert to postman
                if (requestItem.rawModeData && requestItem.rawModeData.startsWith('file:')) {
                    var fileName = requestItem.rawModeData.substring(5);
                    console.log('Reading in rawModeData from file:%s', fileName);

                    try {
                        requestItem.rawModeData = fs.readFileSync(fileName, 'utf8');
                        changes =true;
                    } catch (e) {
                        if (e.code === 'ENOENT') {
                            console.log('File not found!');
                        } else {
                            throw e;
                        }
                    }
                } 

            }, this);

            if (changes) {
                var collectionFileName = options.collectionFileName + '.out';
                fs.writeFileSync(collectionFileName, JSON.stringify(requestJSON, null, 1));
                console.log('done something');
            }

        } else {
            this.iterationRunner.execute();
        }
        
    }
});

module.exports = Newman;
