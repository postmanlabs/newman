var jsface = require('jsface'),
    fs = require('fs'),
    Errors = require('./ErrorHandler'),
    mkdirp = require('mkdirp');

/**
 * @name Importer
 * @namespace
 * @classdesc Static class meant to parse and save Postman backup files
 */
var Importer = jsface.Class({
    $singleton: true,

    importFile: function (filePath, pretty) {
        var jsonObj = {};
        try {
            jsonObj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            Errors.terminateWithError("Could not find file: " + filePath + "\n" + e);
        }

        var indentLevel = (pretty) ? 2 : 0;

        var collections = jsonObj.collections;
        var environments = jsonObj.environments;
        var globals = jsonObj.globals;
        var i;

        if (!collections instanceof Array) {
            Errors.terminateWithError("Collections must be an array...aborting");
        }
        if (!environments instanceof Array) {
            Errors.terminateWithError("Environments must be an array...aborting");
        }
        if (!globals instanceof Array) {
            Errors.terminateWithError("Globals must be an array...aborting");
        }

        var numC = collections.length;
        var numE = environments.length;

        mkdirp.sync('data/collections');
        mkdirp.sync('data/environments');
        mkdirp.sync('data/globals');


        for (i = 0; i < numC; i++) {
            this._saveCollection(collections[i], indentLevel);
        }

        for (i = 0; i < numE; i++) {
            this._saveEnvironment(environments[i], indentLevel);
        }

        this._saveGlobal(globals, indentLevel);
    },

    _saveCollection: function (thisCollection, indentLevel) {
        var collectionName = thisCollection.name;
        if (collectionName === null || collectionName === "") {
            collectionName = thisCollection.id;
        }
        var collectionString = JSON.stringify(thisCollection, undefined, indentLevel) + "\n";

        fs.writeFile('data/collections/' + collectionName + ".json", collectionString, function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('Collection (' + collectionName + ') saved');
            }
        });
    },

    _saveEnvironment: function (environment, indentLevel) {
        var envName = environment.name;
        if (envName === null || envName === "") {
            envName = environment.id;
        }
        var envString = JSON.stringify(environment, undefined, indentLevel) + "\n";

        fs.writeFile('data/environments/' + envName + ".json", envString, function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('Environment (' + envName + ') saved');
            }
        });
    },

    _saveGlobal: function (globals, indentLevel) {
        var globalName = "global_" + (new Date().getTime());
        fs.writeFile('data/globals/' + globalName + ".json", JSON.stringify(globals, undefined, indentLevel) + "\n", function (err) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('Global (' + globalName + ') saved');
            }
        });
    }


});

module.exports = Importer;
