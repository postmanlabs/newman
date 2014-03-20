var jsface = require("jsface"),
	AbstractRunner = require("AbstractRunner");

var CollectionRunner = jsface.Class(AbstractRunner, {
	/**
	 * [execute Execute the Postman Collection]
	 * @param  {[Object]} collection [Collection of Postman Requests]
	 * @return {[Class]}            [Return Itself]
	 */
	execute: function(collection) {
		// TODO: What to do with the collection ?
		return this.$class.$superp.execute.call(this, collection);
	}
});

module.exports = CollectionRunner;