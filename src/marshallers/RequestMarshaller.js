var jsface = require("jsface"),
    CollectionModel = require('../models/CollectionModel.js');

var RequestMarshaller = jsface.Class({
	constructor: function(collectionJson) {
        this.collection = new CollectionModel(collectionJson);
	},
	getCollections: function() {
		return this.collection;
	}
});

module.exports = RequestMarshaller;
