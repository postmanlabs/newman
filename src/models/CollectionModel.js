var jsface = require('jsface'),
    _und = require('underscore'),
    FolderModel = require('./FolderModel.js'),
    RequestModel = require('./RequestModel.js'),
    ParentModel = require('./ParentModel.js');

/** 
 * @class CollectionModel 
 * Collection class that inherits from ParentModel representing
 * a postman collection object.
 */
var CollectionModel = jsface.Class(ParentModel, {
    constructor: function(collectionJson) {
        this.$class.$super.call(this, collectionJson);
        this.order       = collectionJson.order;
        this.requests    = this.initModel(RequestModel, collectionJson.requests);
        this.folders     = this.initModel(FolderModel, collectionJson.folders);
    },
    /** Initializes a Model object with the modelsJson as the initial data */
    initModel: function(Model, modelsJson) {
        var models = _und.map(modelsJson, function(model) {
            return new Model(model);
        });
        return models;
    },
    /** Returns the total order of request IDs in the collection as an array
     *  Order - 
     *  1. Folders (order as per the collection)
     *  2. Collection level order
     */
    getOrderIds: function() {
        var totalOrder = _und.map(this.folders, function(folder) {
            return folder.order
        });
        totalOrder.push(this.order);
        return _und.flatten(totalOrder);
    },
    /** Returns the request with the given request ID if exists null otherwise */
    getRequestWithId: function(id) {
        return _und.find(this.requests, function(request) {
            return request.id === id;
        });
    },
    /** Returns an array of request objects as ordered as per the getOrderIds method */
    getOrderedRequests: function() {
        var orderedIds = this.getOrderIds();
        var orderedRequests = [];
        _und.each(orderedIds, function(id) {
            orderedRequests.push(this.getRequestWithId(id));
        }, this);
        return orderedRequests;
    }
});

module.exports = CollectionModel;
