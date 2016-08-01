var _ = require('lodash'),
    expect = require('expect.js');

/* global describe, it */
describe('run summary', function () {
    // @todo add test for computation of timings, transfer sizes and avergare response time
    var Summary = require('../../lib/summary'),
        EventEmitter = require('eventemitter3'),
        sdk = require('postman-collection'),

        TRACKED_EVENTS = ['iteration', 'item', 'script', 'prerequest', 'request', 'test', 'assertion',
            'testScript', 'prerequestScript'],
        SURROGATE_EVENTS = ['testScript', 'prerequestScript'];

    it('must require only an EventEmitter during construction', function () {
        expect(function () {
            var summary = new Summary();
            expect(summary).not.be.ok();
        }).withArgs().to.throwError();

        expect(function () {
            var summary = new Summary(new EventEmitter());
            expect(summary).be.ok();
        }).withArgs().not.throwError();

        expect(function () {
            var summary = new Summary(new EventEmitter(), {});
            expect(summary).be.ok();
        }).withArgs().not.throwError();
    });

    it('must have tracking properties', function () {
        var summary = new Summary(new EventEmitter());

        expect(Object.keys(summary)).to.eql(['info', 'collection', 'environment', 'global', 'stats', 'timings',
            'transfers', 'failures', 'error']);

        expect(summary.info).be.an('object');
        expect(summary.environment.object).be.an('function');
        expect(summary.global.object).be.an('function');
        expect(summary.failures).be.an('array');
        expect(summary.stats).be.an('object');
        expect(summary.timings).be.an('object');
        expect(summary.transfers).be.an('object');
    });

    describe('runtime event statistics', function () {
        it('must track relevant events', function () {
            var emitter = new EventEmitter(),
                summary = new Summary(emitter);

            expect(Object.keys(summary.stats)).to.eql(_.map(TRACKED_EVENTS, function (name) {
                return name + 's';
            }));
        });

        TRACKED_EVENTS.forEach(function (eventName) {
            describe(`${eventName} event`, function () {
                var beforeEventName = _.camelCase(`before-${eventName}`),
                    emitter,
                    summary,
                    tracker;

                beforeEach(function () {
                    emitter = new EventEmitter();
                    summary = new Summary(emitter);
                    tracker = summary.stats[eventName + 's'];
                });
                afterEach(function () {
                    emitter = null;
                    summary = null;
                    tracker = null;
                });

                it('must have initial counters', function () {
                    expect(tracker).to.eql({ total: 0, pending: 0, failed: 0 });
                });

                it(`must bump pending counters when a ${beforeEventName} is fired`, function () {
                    emitter.emit(beforeEventName, null, {});
                    expect(tracker).to.eql({ total: 0, pending: 1, failed: 0 });
                });

                it(`must unbump pending counters when a ${eventName} is fired and add total`, function () {
                    emitter.emit(beforeEventName, null, {});
                    emitter.emit(eventName, null, {});

                    expect(tracker).to.eql({ total: 1, pending: 0, failed: 0 });
                });

                it(`must directly bump total ${eventName} with no pending ${beforeEventName} event`, function () {
                    emitter.emit(eventName, null, {});
                    emitter.emit(eventName, null, {});
                    expect(tracker).to.eql({ total: 2, pending: 0, failed: 0 });
                });

                it(`must bump failure count when ${eventName} has error (1st) argument`, function () {
                    emitter.emit(beforeEventName, new Error(`faux error on ${beforeEventName}`), {});
                    emitter.emit(eventName, new Error(`faux error on ${eventName}`), {});
                    expect(tracker).to.eql({ total: 1, pending: 0, failed: 1 });
                });
            });
        });
    });

    describe('failure logging', function () {

        describe('surrogate (pseudo) event', function () {
            SURROGATE_EVENTS.forEach(function (eventName) {
                var beforeEventName = _.camelCase(`before-${eventName}`),
                    emitter,
                    summary;

                beforeEach(function () {
                    emitter = new EventEmitter();
                    summary = new Summary(emitter);
                });
                afterEach(function () {
                    emitter = null;
                    summary = null;
                });

                it(`${eventName}must not track errors`, function () {
                    emitter.emit(beforeEventName, new Error(`faux ${beforeEventName} error`), {});
                    emitter.emit(eventName, new Error(`faux ${eventName} error`), {});

                    expect(summary.failures.length).be(0);
                });
            });
        });

        _.difference(TRACKED_EVENTS, SURROGATE_EVENTS).forEach(function (eventName) {
            describe(`${eventName} event`, function () {
                var beforeEventName = _.camelCase(`before-${eventName}`),
                    emitter,
                    summary;

                beforeEach(function () {
                    emitter = new EventEmitter();
                    summary = new Summary(emitter);
                });

                afterEach(function () {
                    emitter = null;
                    summary = null;
                });

                it('must append event failure arguments to failures array', function () {
                    emitter.emit(beforeEventName, new Error(`faux ${beforeEventName} error`), {});
                    emitter.emit(eventName, new Error(`faux ${eventName} error`), {});

                    expect(summary.failures.length).be(2);
                    expect(summary.failures[0].error.message).be(`faux ${beforeEventName} error`);
                    expect(summary.failures[1].error.message).be(`faux ${eventName} error`);
                });

                it('object of "before-*" must have relevant data', function () {
                    emitter.emit(beforeEventName, new Error(`faux ${beforeEventName} error`), {});
                    emitter.emit(eventName, new Error(`faux ${eventName} error`), {});

                    expect(summary.failures.length).be(2);
                    var failure = summary.failures[0];

                    expect(failure.error.message).be(`faux ${beforeEventName} error`);
                    expect(Object.keys(failure)).to.eql(['error', 'at', 'source', 'parent', 'cursor']);

                    expect(failure).have.property('at');
                    expect(failure.at).be(beforeEventName);

                    expect(failure).have.property('source');
                    expect(failure.source).be('<unknown>');

                    expect(failure).have.property('cursor');
                    expect(failure.cursor).be.an('object');
                });
            });
        });

        describe('execution tracking', function () {
            var emitter,
                collection,
                summary;

            beforeEach(function () {
                collection = new sdk.Collection({
                    item: [{
                        id: 'i1', request: 'http://localhost/1'
                    }, {
                        id: 'i2', request: 'http://localhost/1'
                    }]
                });
                emitter = new EventEmitter();
                summary = new Summary(emitter, {
                    collection: collection
                });
            });

            afterEach(function () {
                collection = null;
                emitter = null;
                summary = null;
            });

            it('should add executions array', function () {
                var collection = summary.collection,
                    item = collection.items.one('i1');

                emitter.emit('request', null, {
                    item: item,
                    cursor: { iteration: 0 }
                });
                emitter.emit('request', null, {
                    item: item,
                    cursor: { iteration: 1 }
                });

                expect(item).have.property('executions');
                expect(item.executions).be.an('array');
                expect(item.executions.length).be(2);

                expect(collection.items.one('i2')).not.have.property('executions');
            });

            it('should store request and response', function () {
                var collection = summary.collection,
                    item = collection.items.one('i1');

                emitter.emit('request', null, {
                    item: item,
                    request: { id: 'request-1' },
                    response: { id: 'response-1' },
                    cursor: { iteration: 0 }
                });

                expect(item).have.property('executions');
                expect(item.executions).be.an('array');
                expect(item.executions.length).be(1);

                expect(item.executions).to.eql([{
                    request: { id: 'request-1' },
                    requestError: null,
                    response: { id: 'response-1' }
                }]);
            });

            it('should store request error with response info even if request is missing', function () {
                var collection = summary.collection,
                    item = collection.items.one('i1');

                emitter.emit('request', null, {
                    item: item,
                    request: { id: 'request-1' },
                    response: { id: 'response-1' },
                    cursor: { iteration: 0 }
                });

                expect(item).have.property('executions');
                expect(item.executions).be.an('array');
                expect(item.executions.length).be(1);

                expect(item.executions).to.eql([{
                    request: { id: 'request-1' },
                    requestError: null,
                    response: { id: 'response-1' }
                }]);
            });
        });
    });
});
