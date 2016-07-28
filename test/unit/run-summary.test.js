var _ = require('lodash'),
    expect = require('expect.js');

/* global describe, it */
describe('run summary', function () {
    var Summary = require('../../lib/summary'),
        EventEmitter = require('eventemitter3');

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
        var TRACKED_EVENTS = ['iteration', 'item', 'script', 'prerequest', 'request', 'test', 'assertion',
            'testScript', 'prerequestScript'],
            SURROGATE_EVENTS = ['testScript', 'prerequestScript'];

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
                    isSurrogateEvent = SURROGATE_EVENTS.indexOf(eventName) > -1,
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

                !isSurrogateEvent && it('must append event failure arguments to failures array', function () {
                    emitter.emit(beforeEventName, new Error(`faux ${beforeEventName} error`), {});
                    emitter.emit(eventName, new Error(`faux ${eventName} error`), {});

                    expect(summary.failures.length).be(2);
                    // expect(summary.failures[0].message).be(`faux ${beforeEventName} error`);
                    // expect(summary.failures[1].message).be(`faux ${eventName} error`);
                });
            });
        });
    });

});
