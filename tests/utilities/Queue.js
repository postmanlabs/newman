// tests for Queue
var assert = require('assert'),
    _und = require('underscore'),
    Queue = require('../../src/utilities/Queue');

describe("Queue", function () {
    beforeEach(function () {
        this.Q = new Queue();
    });

    it("Should add items to the queue", function () {
        var a = { a: 1 };
        var b = { b: 1 };
        var c = { c: 1 };
        this.Q.addToQueue(a);
        this.Q.addToQueue(b);
        this.Q.addToQueue(c);
        assert.equal(this.Q._queue.length, 3);
    });

    it("Should return items from the queue", function () {
        var a = { a: 1 };
        var b = { b: 1 };
        this.Q.addToQueue(a);
        this.Q.addToQueue(b);
        var items = this.Q.getFromQueueWithoutRemoving();
        assert.deepEqual(a, items);
        assert.equal(this.Q._queue.length, 2);
    });


    afterEach(function () {
        this.Q.purgeAllItemsInQueue();
    });
});
