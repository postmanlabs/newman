var jsface            = require('jsface'),
	_und              = require('underscore'),
	FolderModel       = require('./FolderModel.js'),
	RequestModel      = require('./RequestModel.js'),
	ParentModel       = require('./ParentModel.js'),
	VariableProcessor = require('../utilities/VariableProcessor.js');

/** 
 * @class CollectionModel 
 * @classdesc Collection class that inherits from ParentModel representing
 * a postman collection object.
 * @extends ParentModel
 * @param collectionJson {JSON} Takes the Postman Collection as the input.
 */
var CollectionModel = jsface.Class(ParentModel, {
    constructor: function(collectionJson) {
        this.$class.$super.call(this, collectionJson);
        this.order       = collectionJson.order;
        this.requests    = this.initModel(RequestModel, collectionJson.requests);
        this.folders     = this.initModel(FolderModel, collectionJson.folders);
    },
    /** 
     * Initializes a Model object with the modelsJson as the initial data
     * @param  {ParentModel} Model      Type of Model
     * @param  {Array} modelsJson Array of JSON objets
     * @return {Model}
     * @memberOf CollectionModel
     */
    initModel: function(Model, modelsJson) {
        var models = _und.map(modelsJson, function(model) {
            return new Model(model);
        });
        return models;
    },
    /** 
     * 
     * @function getOrderOfIds
     * @desc Returns the total order of request IDs in the collection as an array
     *  Order - 
     *  1. Folders (order as per the collection)
     *  2. Collection level order
     *  @memberOf CollectionModel
     *  @return {Array} Flattens array of request Id's.
     */
    getOrderOfIds: function() {
        var totalOrder = _und.map(this.folders, function(folder) {
            return folder.order
        });
        totalOrder.push(this.order);
        return _und.flatten(totalOrder);
    },
    /** 
     * Returns the request with the given request ID if exists null otherwise
     * @param  {String} id RequestId
     * @return {RequestModel} The RequestModel with the given id.
     * @memberOf CollectionModel
     */
    getRequestWithId: function(id) {
        return _und.find(this.requests, function(request) {
            return request.id === id;
        });
    },
    /** 
     * Returns an array of request objects as ordered as per the getOrderIds method
     * @return {Array} Array with RequestModel ordered occording to the right id's.
     * @memberOf CollectionModel
     */
    getOrderedRequests: function() {
        var orderedIds = this.getOrderOfIds();
        var orderedRequests = [];
        _und.each(orderedIds, function(id) {
            orderedRequests.push(this.getRequestWithId(id));
        }, this);
        return orderedRequests;
    },
	
	/**
	 * Returns an array of request objects as ordered as per the getOrderIds method 
	 * but with the variables processed.
	 * @param Takes the newman options as a parameter
	 * @return {Array} Array with RequestModel ordered occording to the right id's and processed variables.
	 * @memberOf CollectionModel
	 */
	getMarshalledRequests: function(newmanOptions) {
		// TODO: @viig99: reading the newman options doesnt feel right here. Got a better idea?
		var orderedRequests = this.getOrderedRequests();

		// processing for environment variables
		if (newmanOptions["envJson"] !== undefined) {
			_und.each(orderedRequests, function(request) {
				VariableProcessor.getProcessedRequest(request, {
					envJson: newmanOptions["envJson"]
				});
			});
		}

		return orderedRequests;
	}
});

module.exports = CollectionModel;
