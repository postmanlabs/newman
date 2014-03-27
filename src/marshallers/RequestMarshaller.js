var jsface = require("jsface"),
    CollectionModel = require('../models/CollectionModel.js');

var RequestMarshaller = jsface.Class({
	constructor: function(collectionJson) {
        this.collection = new CollectionModel(collectionJson);
	},
	getCollection: function() {
		return this.collection;
	}
});

module.exports = RequestMarshaller;
