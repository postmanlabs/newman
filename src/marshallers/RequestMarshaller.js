var jsface = require("jsface"),
    CollectionModel = require('../models/CollectionModel.js'),
    _und = require('underscore');

var RequestMarshaller = jsface.Class({
	constructor: function(collectionJson) {
        this.collection = new CollectionModel(collectionJson);
	},
	getCollection: function() {
		return this.collection;
	},
    getMarshalledCollection: function() {
        // returns an ordered array of request objects
        return this.collection.getOrderedRequests();
    }
});

module.exports = RequestMarshaller;
