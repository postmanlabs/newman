var _ = require('lodash'),
    expect = require('expect.js');

/* global describe, it */
describe('run summary', function () {
    // @todo add test for computation of timings, transfer sizes and average response time
    var Summary = require('../../lib/run/summary'),
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

    it('must have the relevant top-level data structures', function () {
        var summary = new Summary(new EventEmitter());
        expect(_.keys(summary).sort()).to.eql(['collection', 'environment', 'globals', 'run'].sort());
    });

    it('must have run related properties', function () {
        var summary = new Summary(new EventEmitter());

        expect(summary).have.property('run');
        expect(_.keys(summary.run).sort())
            .to.eql(['stats', 'timings', 'executions', 'transfers', 'failures', 'error'].sort());
        expect(summary.run.failures).be.an('array');
        expect(summary.run.stats).be.an('object');
        expect(summary.run.timings).be.an('object');
        expect(summary.run.transfers).be.an('object');
    });

    describe('runtime event statistics', function () {
        it('must track relevant events', function () {
            var emitter = new EventEmitter(),
                summary = new Summary(emitter);

            expect(_.keys(summary.run.stats)).to.eql(_.map(TRACKED_EVENTS, function (name) {
                return name + 's';
            }));
        });

        TRACKED_EVENTS.forEach(function (eventName) {
            describe(`${eventName} event`, function () {
                var beforeEventName = _.camelCase(`before-${eventName}`),
                    emitter,
                    summary,
                    tracker,
                    options;

                beforeEach(function () {
                    emitter = new EventEmitter();
                    summary = new Summary(emitter);
                    options = {
                        cursor: { ref: 'fake-ref' }
                    };
                    tracker = summary.run.stats[eventName + 's'];
                });
                afterEach(function () {
                    emitter = null;
                    summary = null;
                    options = null;
                    tracker = null;
                });

                it('must have initial counters', function () {
                    expect(tracker).to.eql({ total: 0, pending: 0, failed: 0 });
                });

                it(`must bump pending counters when a ${beforeEventName} is fired`, function () {
                    emitter.emit(beforeEventName, null, options);
                    expect(tracker).to.eql({ total: 0, pending: 1, failed: 0 });
                });

                it(`must unbump pending counters when a ${eventName} is fired and add total`, function () {
                    emitter.emit(beforeEventName, null, options);
                    emitter.emit(eventName, null, options);

                    expect(tracker).to.eql({ total: 1, pending: 0, failed: 0 });
                });

                it(`must directly bump total ${eventName} with no pending ${beforeEventName} event`, function () {
                    emitter.emit(eventName, null, options);
                    emitter.emit(eventName, null, options);
                    expect(tracker).to.eql({ total: 2, pending: 0, failed: 0 });
                });

                it(`must bump failure count when ${eventName} has error (1st) argument`, function () {
                    emitter.emit(beforeEventName, new Error(`faux error on ${beforeEventName}`), options);
                    emitter.emit(eventName, new Error(`faux error on ${eventName}`), options);
                    expect(tracker).to.eql({ total: 1, pending: 0, failed: 1 });
                });
            });
        });
    });

    describe('failure logging', function () {

        describe('surrogate (pseudo) event', function () {
            _.forEach(SURROGATE_EVENTS, function (eventName) {
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

                    expect(summary.run.failures.length).be(0);
                });
            });
        });

        _(TRACKED_EVENTS).difference(SURROGATE_EVENTS).forEach(function (eventName) {
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

                    expect(summary.run.failures.length).be(2);
                    expect(summary.run.failures[0].error.message).be(`faux ${beforeEventName} error`);
                    expect(summary.run.failures[1].error.message).be(`faux ${eventName} error`);
                });

                it('object of "before-*" must have relevant data', function () {
                    emitter.emit(beforeEventName, new Error(`faux ${beforeEventName} error`), {});
                    emitter.emit(eventName, new Error(`faux ${eventName} error`), {});

                    expect(summary.run.failures.length).be(2);
                    var failure = summary.run.failures[0];

                    expect(failure.error.message).be(`faux ${beforeEventName} error`);
                    expect(_.keys(failure)).to.eql(['error', 'at', 'source', 'parent', 'cursor']);

                    expect(failure).have.property('at');
                    expect(failure.at).be(beforeEventName);

                    expect(failure).have.property('source');
                    expect(failure.source).be(undefined);

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

            it('should add to the executions array', function () {
                var executions = summary.run.executions,
                    item = collection.items.one('i1');

                emitter.emit('request', null, {
                    item: item,
                    cursor: { ref: '1', iteration: 0 }
                });
                emitter.emit('request', null, {
                    item: item,
                    cursor: { ref: '2', iteration: 1 }
                });

                expect(executions.length).be(2);
                expect(executions[0].cursor).to.eql({ ref: '1', iteration: 0 });
                expect(executions[1].cursor).to.eql({ ref: '2', iteration: 1 });
            });

            it('should store request and response', function () {
                var executions = summary.run.executions,
                    item = collection.items.one('i1');

                emitter.emit('request', null, {
                    item: item,
                    request: { id: 'request-1' },
                    response: { id: 'response-1' },
                    cursor: { ref: '1', iteration: 0 }
                });

                expect(executions.length).be(1);
                expect(executions[0]).to.eql({
                    cursor: { ref: '1', iteration: 0 },
                    request: { id: 'request-1' },
                    response: { id: 'response-1' },
                    id: item.id
                });
            });

            it('should store request error with response info even if request is missing', function () {
                var executions = summary.run.executions,
                    item = collection.items.one('i1');

                emitter.emit('request', { message: 'failed' }, {
                    item: item,
                    request: { id: 'request-1' },
                    response: { id: 'response-1' },
                    cursor: { ref: '1', iteration: 0 }
                });

                expect(executions.length).be(1);
                expect(executions[0]).to.eql({
                    cursor: { ref: '1', iteration: 0 },
                    request: { id: 'request-1' },
                    response: { id: 'response-1' },
                    id: item.id,
                    requestError: { message: 'failed' }
                });
            });
        });
    });
});
