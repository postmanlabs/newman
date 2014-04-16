var jsface = require("jsface");

/**
 * @name Queue
 * @classdesc Queue meant to be used as mixin
 * @namespace
 */
var Queue = jsface.Class({
	_queue: [],
	addToQueue: function(obj) {
		this._queue.push(obj);
	},
	getFromQueue: function() {
		return this._queue.shift();
	},
	purgeAllItemsInQueue: function() {
		this._queue.splice(0, this._queue.length);
	},
	isEmptyQueue: function() {
		return !this._queue.length;
	}
});

module.exports = Queue;
