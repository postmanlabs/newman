var jsface = require("jsface"),
	AbstractRunner = require("AbstractRunner");

var TestRunner = jsface.Class(AbstractRunner, {
	/**
	 * [execute Execute the Postman Tests]
	 * @param  {[Object]} collection [Collection of Postman Requests with Tests.]
	 * @return {[Class]}            [Return Itself]
	 */
	execute: function(collection) {
		// TODO: What to do with the test collection ?
		return this.$class.$superp.execute.call(this, collection);
	}
});

module.exports = TestRunner;