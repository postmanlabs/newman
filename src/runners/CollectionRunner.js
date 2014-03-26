var jsface = require("jsface"),
	AbstractRunner = require("./AbstractRunner"),
	request = require('ahr2');

var CollectionRunner = jsface.Class(AbstractRunner, {
	constructor: function(collection) {
		this.$class.$super.call(this, collection);
	},
	/**
	 * [execute Execute the Postman Collection]
	 * @param  {[Object]} collection [Collection of Postman Requests]
	 * @return {[Class]}            [Return Itself]
	 */
	execute: function() {
		this.collection.forEach(function(postmanRequest) {
			// TODO: Run the postmanRequest using ahr2 and handle the reponse.

			/*
			 * If Sucess send the Response to approriate module
			 * 	1) DefaultResponseHandler.
			 *  2) TestReponseHandler.
			 * Else
			 * 	Handler the errors in ErrorHandler module.
			 * Use Logger Class for all logging.
			 */
		});
		this.$class.$superp.execute.call(this);
	}
});

module.exports = CollectionRunner;