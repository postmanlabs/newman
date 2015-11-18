var jsface = require("jsface"),
    events = require("events"),
    emitter = new events.EventEmitter();

/**
 * @name EventEmitter
 * @namespace
 * @classdesc Mixin class providing event functionality.
 */
var EventEmitter = jsface.Class({
    addEventListener: function (name, callback) {
        emitter.on(name, callback);
        return this;
    },
    addEventListenerOnce: function (name, callback) {
        emitter.once(name, callback);
        return this;
    },
    removeEventListener: function (name, callback) {
        emitter.removeListener(name, callback);
        return this;
    },
    removeAllListeners: function () {
        emitter.removeAllListeners();
        return this;
    },
    getAllListeners: function (name) {
        return emitter.listeners(name);
    },
    listenerCount: function (name) {
        return events.EventEmitter.listenerCount(emitter, name);
    },
    emit: function (name) {
        emitter.emit.apply(emitter, arguments);
        return this;
    }
});

module.exports = EventEmitter;
