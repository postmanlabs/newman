var jsface = require("jsface"),
    _und = require('underscore');

/**
 * @name Queue
 * @classdesc Queue meant to be used as mixin
 * @namespace
 */
var Queue = jsface.Class({
    _queue: [],
    _currentIndex: -1,
    addToQueue: function (obj) {
        this._queue.push(obj);
    },
    getFromQueueWithoutRemoving: function() {
        return _und.clone(this._queue[0]);
    },
    purgeAllItemsInQueue: function () {
        this._queue.splice(0, this._queue.length);
    },
    isEmptyQueue: function () {
        return !this._queue.length;
    },
    getAllItems: function () {
        return this._queue;
    },
    getItemWithIndex: function (index) {
        return this._queue.splice(index, 1);
    },
    getItemWithIndexWithoutRemoval: function (index) {
        this._currentIndex = index;
        return _und.clone(this._queue[index]);
    },
    getNextItemFromQueue: function() {
        this._currentIndex++;
        if(this._currentIndex >= this._queue.length) {
            return null;
        }
        return this._queue[this._currentIndex];
    },
});

module.exports = Queue;
