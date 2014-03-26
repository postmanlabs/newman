var jsface = require('jsface'),
    _und = require('underscore'),
    FolderModel = require('./FolderModel.js'),
    RequestModel = require('./RequestModel.js');

var CollectionModel = jsface.Class({
    constructor: function(collectionJson) {
        this.id          = collectionJson.id;
        this.name        = collectionJson.name;
        this.description = collectionJson.description;
        this.order       = collectionJson.order;
        this.requests    = this.initModel(RequestModel, collectionJson.requests);
        this.folders     = this.initModel(FolderModel, collectionJson.folders);
        return this;
    },
    initModel: function(Model, modelsJson) {
        // initializes a Model object with the modelsJson as 
        // the initial data
        models = _und.map(modelsJson, function(model) {
            return new Model(model);
        });
        return models;
    }
});

module.exports = CollectionModel;
