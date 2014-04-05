// tests for Emitter
var assert = require('assert'),
	_und   = require('underscore'),
	sinon   = require('sinon'),
	jsface   = require('jsface'),
	Emitter  = require('../../src/utilities/EventEmitter');

describe("Emitter", function() {
	beforeEach(function() {
		this.emitter = new Emitter();
	});

	it("Event Called should call the callback function.", function() {
		var m = sinon.spy();
		this.emitter.addEventListener('a', m);
		this.emitter.emit('a');
		assert(m.called);
	});

	it("Event Called should call all the callback functions.", function() {
		var m = sinon.spy();
		var n = sinon.spy();
		var emitter1 = new Emitter();
		var emitter2 = new Emitter();
		emitter1.addEventListener('a', m);
		emitter2.addEventListener('a', n);
		this.emitter.emit('a');
		assert(m.called);
		assert(n.called);
	});

	it("addListener should get called only multiple times.", function() {
		var m = sinon.spy();
		var emitter1 = new Emitter();
		emitter1.addEventListener('a', m);
		this.emitter.emit('a');
		this.emitter.emit('a');
		assert(m.calledTwice);
	});

	it("addListenerOnce should get called only once.", function() {
		var m = sinon.spy();
		var emitter1 = new Emitter();
		emitter1.addEventListenerOnce('a', m);
		this.emitter.emit('a');
		this.emitter.emit('a');
		assert(m.calledOnce);
	});

	it("removeListener should remove the event Listener.", function() {
		var m = sinon.spy();
		this.emitter.addEventListener('a', m);
		this.emitter.removeEventListener('a', m);
		this.emitter.emit('a');
		assert.equal(m.called, false);
	});

	it("removeAllListeners should remove all the event Listeners.", function() {
		var m = sinon.spy();
		this.emitter.addEventListener('a', m);
		this.emitter.addEventListener('b', m);
		this.emitter.addEventListener('c', m);
		this.emitter.removeAllListeners();
		this.emitter.emit('a');
		this.emitter.emit('b');
		assert.equal(m.called, false);
	});

	it("listenerCount should return the count of listener for a event.", function() {
		var m = sinon.spy();
		this.emitter.addEventListener('a', m);
		this.emitter.addEventListener('a', m);
		assert.equal(this.emitter.listenerCount('a'), 2);
	});

	it("Emit should call the callback with all the passed parameters.", function() {
		var m = sinon.spy();
		this.emitter.addEventListener('a', m);
		this.emitter.emit('a', 1, 2, 3);
		assert(m.calledWith(1, 2, 3));
	});

	afterEach(function() {
		this.emitter.removeAllListeners();
	});
});