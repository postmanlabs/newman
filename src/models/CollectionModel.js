var jsface = require('jsface'),
    _und = require('underscore'),
    FolderModel = require('./FolderModel.js'),
    RequestModel = require('./RequestModel.js'),
    ParentModel = require('./ParentModel.js');

var CollectionModel = jsface.Class(ParentModel, {
    constructor: function(collectionJson) {
        this.$class.$super.call(this, collectionJson);
        this.order       = collectionJson.order;
        this.requests    = this.initModel(RequestModel, collectionJson.requests);
        this.folders     = this.initModel(FolderModel, collectionJson.folders);
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
