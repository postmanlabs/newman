var jsface = require('jsface'),
    fs     = require('fs'),
    Errors = require('./ErrorHandler'),
    _und   = require('underscore');
var mkdirp = require('mkdirp');

/**
 * @name Helpers
 * @namespace
 * @classdesc Helper class with useful methods used throughout Newman
 */
var Importer = jsface.Class({
    $singleton: true,

    importFile: function(filePath) {
        var jsonObj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        var collections = jsonObj.collections;
        var environments = jsonObj.environments;
        var globals = jsonObj.globals;
        var i;

        if(!collections instanceof Array) {
            Errors.parseError("Collections must be an array...aborting");
        }
        if(!environments instanceof Array) {
            Errors.parseError("Environments must be an array...aborting");
        }
        if(!globals instanceof Array) {
            Errors.parseError("Globals must be an array...aborting");
        }

        var numC = collections.length;
        var numE = environments.length;
        var numG = globals.length;

        mkdirp.sync('data/collections');
        mkdirp.sync('data/environments');
        mkdirp.sync('data/globals');


        for(i=0;i<numC;i++) {
            this._saveCollection(collections[i]);
        }

        for(i=0;i<numE;i++) {
            this._saveEnvironment(environments[i]);
        }

        this._saveGlobal(globals);
    },

    _saveCollection: function(thisCollection) {
        var collectionName = thisCollection.name;
        if(collectionName==null || collectionName=="") {
            collectionName = thisCollection.id;
        }
        var collectionString = JSON.stringify(thisCollection);

        fs.writeFile('data/collections/'+collectionName+".json", collectionString, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('Collection ('+collectionName+') saved');
        });
    },

    _saveEnvironment: function(environment) {
        var envName = environment.name;
        if(envName==null || envName=="") {
            envName = environment.id;
        }
        var envString = JSON.stringify(environment);

        fs.writeFile('data/environments/'+envName+".json", envString, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('Environment ('+envName+') saved');
        });
    },

    _saveGlobal: function(globals) {
        var globalName = "global_"+(new Date().getTime())+".json";
        fs.writeFile('data/globals/'+globalName+".json", JSON.stringify(globals), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('Global ('+globalName+') saved');
        });
    }


});

module.exports = Importer;
