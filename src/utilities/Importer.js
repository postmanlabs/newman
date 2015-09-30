var jsface = require('jsface'),
    fs     = require('fs'),
    Errors = require('./ErrorHandler'),
    IterationRunner = require('../runners/IterationRunner'),
    _und = require('underscore'),
    path = require('path'),
    mkdirp = require('mkdirp');

/**
 * @name Importer
 * @namespace
 * @classdesc Static class meant to parse and save Postman backup files
 */
var Importer = jsface.Class({
    $singleton: true,

    importFile: function(filePath, pretty) {
        var jsonObj={};
        try {
            jsonObj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch(e) {
            Errors.terminateWithError("Could not find file: "+filePath+"\n"+e);
        }

        var indentLevel = (pretty)?2:0;

        var collections = jsonObj.collections;
        var environments = jsonObj.environments;
        var globals = jsonObj.globals;
        var i;

        if(!collections instanceof Array) {
            Errors.terminateWithError("Collections must be an array...aborting");
        }
        if(!environments instanceof Array) {
            Errors.terminateWithError("Environments must be an array...aborting");
        }
        if(!globals instanceof Array) {
            Errors.terminateWithError("Globals must be an array...aborting");
        }

        var numC = collections.length;
        var numE = environments.length;

        mkdirp.sync('data/collections');
        mkdirp.sync('data/environments');
        mkdirp.sync('data/globals');


        for(i=0;i<numC;i++) {
            this._saveCollection(collections[i], indentLevel);
        }

        for(i=0;i<numE;i++) {
            this._saveEnvironment(environments[i], indentLevel);
        }

        this._saveGlobal(globals, indentLevel);
    },

    _saveCollection: function(thisCollection, indentLevel) {
        var collectionName = thisCollection.name;
        if(collectionName===null || collectionName==="") {
            collectionName = thisCollection.id;
        }
        var collectionString = JSON.stringify(thisCollection,undefined,indentLevel)+"\n";

        fs.writeFile('data/collections/'+collectionName+".json", collectionString, function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('Collection ('+collectionName+') saved');
            }
        });
    },

    _saveEnvironment: function(environment, indentLevel) {
        var envName = environment.name;
        if(envName===null || envName==="") {
            envName = environment.id;
        }
        var envString = JSON.stringify(environment,undefined,indentLevel)+"\n";

        fs.writeFile('data/environments/'+envName+".json", envString, function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('Environment ('+envName+') saved');
            }
        });
    },

    _saveGlobal: function(globals, indentLevel) {
        var globalName = "global_"+(new Date().getTime());
        fs.writeFile('data/globals/'+globalName+".json", JSON.stringify(globals,undefined,indentLevel)+"\n", function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('Global ('+globalName+') saved');
            }
        });
    },

    exportJSON: function( requestJSON, options ) {

            //Make the output folder if required
            mkdirp.sync(options.exportJSON);
        
            var changes = false;

            var collectionName = requestJSON.name.replace(/ /g, '');
            requestJSON.name = collectionName;

            //Remove all the spaces from the folder name to make a decent file name
            _und.each(requestJSON.folders, function (folder) {

                var folderItemName = folder.name.replace(/ /g, '');
                if (folderItemName !== folder.name) {
                    changes = true;
                    folder.name = folderItemName;
                }
            });

            var iterationRunner = new IterationRunner(requestJSON, options);

            //Get a ordered list of all the requests
            var orderedCollection = iterationRunner._getOrderedCollection(requestJSON);


            _und.each(orderedCollection, function (postmanRequest) {
                var fileName;

                //Remove spaces from Request Name
                var requestItem = _und.find(requestJSON.requests, function (request) {
                    return request.id === postmanRequest.id;
                });

                requestItem.name = postmanRequest.name.replace(/ /g, '');
                if (requestItem.name !== postmanRequest.name) {
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
                var baseFileName = path.join(options.exportJSON, fileName);

                if (requestItem.tests) {
                    //build a file name for the test data output
                    var testsDatafileName = baseFileName + '.tests.json';

                    var testsJSON = requestItem.tests;
                        //write out the info
                    fs.writeFileSync(testsDatafileName, testsJSON);
                    console.log('dump tests to file: %s', testsDatafileName);
                    requestItem.tests = 'file:' + testsDatafileName;
                }


                if (requestItem.rawModeData) {
                    var rawModeDatafileName = baseFileName + '.rawModeData.json';
                    var rawModeData = requestItem.rawModeData;
                        //write out the info
                    fs.writeFileSync(rawModeDatafileName, rawModeData);
                    console.log('dump rawModeData to file: %s', rawModeDatafileName);
                    requestItem.rawModeData = 'file:' + rawModeDatafileName;
                }


            }, this);

            if (changes) {
                var collectionFileName = path.join(options.exportJSON, collectionName + '.colleciton.json');
                fs.writeFileSync(collectionFileName, JSON.stringify(requestJSON, null, 1));
                console.log('created output file %s', collectionFileName);
            }

        },
    importJSON : function( requestJSON, options ) {
            
            /*take the path supplied and make a single output file which is a postman collection
               find the file name of colelction it is in the new options.collectionFileName
               replace the file: refereces with the actual contents of the file for
                    tests
                    rawModeData
                write a new output file 
            */
        
            //ensure output path exists
            mkdirp.sync(options.importJSON);
        
            console.log('options.collectionFileName:', options.collectionFileName);

            var changes = false;
 
            //Get a ordered list of all the requests
            var iterationRunner = new IterationRunner(requestJSON, options);
            var orderedCollection = iterationRunner._getOrderedCollection(requestJSON);

            _und.each(orderedCollection, function (postmanRequest) {

                var fileName;

                //get the single request item
                var requestItem = _und.find(requestJSON.requests, function (request) {
                    return request.id === postmanRequest.id;
                });

                console.log('processing request :%s, tests:%s', requestItem.name,requestItem.tests);
                
                    

                //take a file reference and convert to postman
                if (requestItem.tests && requestItem.tests.startsWith('file:')) {
                    fileName = requestItem.tests.substring(5);
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
                    fileName = requestItem.rawModeData.substring(5);
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
                var collectionFileName = path.join(options.importJSON, path.basename(options.collectionFileName)+ '.out');
                fs.writeFileSync(collectionFileName, JSON.stringify(requestJSON, null, 1));
                console.log('created output file %s', collectionFileName);
            }

        }
});

module.exports = Importer;
