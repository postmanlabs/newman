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
        var models = _und.map(modelsJson, function(model) {
            return new Model(model);
        });
        return models;
    },
    getOrder: function() {
        // returns the total order of requests in the collection as an array
        // Order - 
        // 1. Folders (order as per the collection)
        // 2. Collection level order
        var totalOrder = _und.map(this.folders, function(folder) {
            return folder.order
        });
        totalOrder.push(this.order);
        return _und.flatten(totalOrder);
    },
    getRequestWithId: function(id) {
        // returns the request with the given id if exists null otherwise
        return _und.find(this.requests, function(request){
            return request.id === id;
        });
    },
    getOrderedRequests: function() {
        // returns an array of request objects as ordered as per the getOrder method
        var orderedIds = this.getOrder();
        var orderedRequests = [];
        _und.each(orderedIds, function(id) {
            orderedRequests.push(this.getRequestWithId(id));
        }, this);
        return orderedRequests;
    }
});

module.exports = CollectionModel;
