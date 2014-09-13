var jsface           = require("jsface"),
    Options          = require('../utilities/Options'),
    log              = require('../utilities/Logger'),
    Helpers          = require('../utilities/Helpers'),
    Globals          = require('../utilities/Globals'),
    EventEmitter     = require('../utilities/EventEmitter'),
    CollectionModel  = require('../models/CollectionModel'),
    FolderModel      = require('../models/FolderModel'),
    CollectionRunner = require("../runners/CollectionRunner"),
    Errors           = require('../utilities/ErrorHandler'),
    fs               = require('fs'),
    path             = require('path'),
    JSON5            = require('json5'),
    _und             = require('underscore'),
    ResponseExporter = require("../utilities/ResponseExporter");

/**
 * @class IterationRunner
 * @param CollectionJson {JSON} Takes a JSON as the input
 * @param Options {JSON} Set of options to pass to the collection runner
 * @param numOfIterations {int} Number of times the iteration has to run
 */
var IterationRunner = jsface.Class([Options, EventEmitter], {
    constructor: function(requestJSON, options) {
        this.setOptions(options);
        this.collection = this._getOrderedCollection(requestJSON);

        //check if only a folder has to be run
        if(options.folderName) {
            this.folder = this._getFolderFromCollection(requestJSON, options.folderName);
            if(!this.folder) {
                Errors.terminateWithError('The folder ['+options.folderName+'] does not exist.');
            }
            this.collection = this._getFolderRequestsFromCollection(this.collection, this.folder);
        }

        if(!isNaN(options.delay) && options.delay%1===0) {
            this.delay=options.delay;
        }
        else if(options.delay==null) {
            this.delay=0;
        }
        else {
            Errors.terminateWithError('The delay must be an integer');
        }

        // collection of environment jsons passed from datafile
        this.dataVars = this._getJsonArraysFromFile();
        this.globalVars = this._getJsonArraysFromGlobalFile();

        var iterationCount = this.getOptions().iterationCount;
        if(iterationCount && this.dataVars.length && iterationCount>this.dataVars.length) {
            log.warn("WARNING: The iterationCount is greater than the number of records in the data file. This could lead to unexpected results\n");
        }

        this.numOfIterations = iterationCount || this.dataVars.length || 1;
        this.iteration = 0;

        // run the next iteration when the collection run is over
        this.addEventListener('collectionRunnerOver', this._runNextIteration.bind(this));
    },

    _getOrderedCollection: function(requestJSON) {
        var collectionModel = new CollectionModel(requestJSON);
        var orderedCollection = collectionModel.getOrderedRequests(this.getOptions());
        return orderedCollection;
    },

    _getFolderFromCollection: function(requestJSON, folderName) {
        var folders = requestJSON.folders;
        var folderNeeded = _und.find(folders, function(folder) {return folder.name===folderName;});
        if(!folderNeeded) {
            return null;
        }
        var folderModel = new FolderModel(folderNeeded);
        return folderModel;
    },

    _getFolderRequestsFromCollection: function(collection, folder) {
        if(!folder || !folder.order) {
            return [];
        }
        var retVal = [];
        var folderOrders = folder.order;
        _und.each(collection,function(request) {
            if(folderOrders.indexOf(request.id)!==-1) {
                retVal.push(request);
            }
        });
        return retVal;
    },

    _kvArrayToObject: function(array) {
        var obj = {};
        _und.each(array,function(kv) {
            obj[kv.key]=kv.value;
        });
        return obj;
    },

    _objectToKvArray: function(obj) {
        var arr=[];
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                arr.push({"key":property, "value":obj[property]});
            }
        }
        return arr;
    },

    // sets the global environment object property as the env vars + globals + dataFiles
    _setGlobalEnvJson: function() {
        if(typeof Globals.envJson.values==="undefined") {
            Globals.envJson.values=[];
        }

        //add the globals (globalJSON, overriden by envJson)
        if(this.globalVars && this.globalVars.length) {
            Globals.globalJson.values = this.globalVars;//Helpers.augmentDataArrays(this.globalVars,Globals.envJson.values);
        }
        else {
            Globals.globalJson={values:[]};
        }

        //add the dataFile vars (overrides everything else)
        if (this.dataVars.length) {
            var dataJson = { values: this.dataVars[this.iteration - 1] }; //data file
            Globals.dataJson.values= dataJson.values;
        }
    },

    _getJsonArraysFromGlobalFile: function() {
        var globalFile = this.getOptions().globalJSON;
        if(globalFile===null) {
            return [];
        }
        return globalFile;
//        var jsonArray = [];
//        if (globalFile) {
//            jsonArray = JSON5.parse(fs.readFileSync(globalFile, 'utf8'));
//        }
//        return jsonArray;
    },

    // parses the json from data file and sends it for transformation
    _getJsonArraysFromFile: function() {
        var dataFile = this.getOptions().dataFile;
        var jsonArray = [];
        if (dataFile) {
            if (path.extname(dataFile) === ".json") {
                // json file
                jsonArray = JSON5.parse(fs.readFileSync(dataFile, 'utf8'));
            } else {
                // assumed csv file
                jsonArray = [];
                var headers;
                var strContents = fs.readFileSync(dataFile, 'utf-8');

                _und.each(strContents.split('\n'), function(row, i) {
                    if (row.length) { // since node reads a blank line as well
                        if (i === 0) {
                            headers = _und.map(row.split(','), function(key) {
                                return key.trim();
                            });
                        } else {
                            var vals = _und.map(row.split(','), function(val) {
                                return val.trim();
                            });
                            jsonArray.push(_und.object(headers, vals));
                        }
                    }
                });
            }

            var envJsonArray = _und.map(jsonArray, function(rawJson) {
                return Helpers.transformToKeyValue(rawJson);
            }, this);
            return envJsonArray;
        }
        return jsonArray;
    },

    // logs the iteration count
    _logStatus: function() {
        log.note("\nIteration " + this.iteration + " of " + this.numOfIterations + "\n");
    },

    // set the global envjson and then run the next iteration
    _runNextIteration: function() {
        if (this.iteration < this.numOfIterations) {
            Globals.iterationNumber = ++this.iteration;
            Globals.dataJson={"values":[]};
            var currentGlobalEnv = Globals.envJson;
            this._setGlobalEnvJson();
            this._runCollection();
            Globals.envJson = currentGlobalEnv;
        } else {
            this._exportResponses();
            this.emit('iterationRunnerOver',Globals.exitCode);
        }
    },

    _runCollection: function() {
        if (this.collection.length) {
            this._logStatus();
            var runner = new CollectionRunner(this.collection, this.getOptions());
            runner.execute();
        }
    },

    _exportResponses: function() {
        ResponseExporter.exportResults();
    },

    /**
     * Runs the iteration. Instantiates a new CollectionRunner and executes it
     */
    execute: function() {
        this._runNextIteration();
    }
});

module.exports = IterationRunner;
