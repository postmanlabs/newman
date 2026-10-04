const EventEmitter = require('events'),
    expect = require('chai').expect,
    xml2js = require('xml2js'),
    sdk = require('postman-collection'),

    JunitReporter = require('../../lib/reporters/junit');

describe('junit reporter', function () {
    var collection,
        item,
        emitter;

    beforeEach(function () {
        collection = new sdk.Collection({
            item: [{ id: 'i1', name: 'Req1', request: 'http://localhost/1' }]
        });
        item = collection.items.one('i1');

        emitter = new EventEmitter();
        emitter.exports = [];
    });

    afterEach(function () {
        collection = null;
        item = null;
        emitter = null;
    });

    it('should report `tests` as the count of unique assertions across all iterations of an item', function (done) {
        // two iterations of the same item, with a *different* number of assertions run in each
        // (e.g. a conditional test script that skips some checks on later iterations)
        emitter.summary = {
            collection: collection,
            run: {
                executions: [
                    {
                        item: item,
                        id: item.id,
                        cursor: { iteration: 0 },
                        response: { responseTime: 10 },
                        assertions: [
                            { assertion: 'status is 200', error: null },
                            { assertion: 'body has id', error: null },
                            { assertion: 'header is set', error: null }
                        ]
                    },
                    {
                        item: item,
                        id: item.id,
                        cursor: { iteration: 1 },
                        response: { responseTime: 10 },
                        assertions: [
                            { assertion: 'status is 200', error: null }
                        ]
                    }
                ],
                timings: { started: Date.now() },
                stats: { tests: { total: 4 } }
            }
        };

        JunitReporter(emitter, {});
        emitter.emit('beforeDone');

        expect(emitter.exports).to.have.lengthOf(1);

        xml2js.parseString(emitter.exports[0].content, function (err, result) {
            expect(err).to.not.be.ok;

            var suite = result.testsuites.testsuite[0];

            // three unique assertion names ran across the two iterations, so three <testcase>
            // elements are emitted, and `tests` must match that, not a single iteration's count
            expect(suite.testcase).to.have.lengthOf(3);
            expect(suite.$).to.have.property('tests', '3');

            done();
        });
    });
});
