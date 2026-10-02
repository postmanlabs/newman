var expect = require('chai').expect,

    JunitReporter = require('../../../lib/reporters/junit');

describe('JUnit reporter script errors', function () {
    var runReporter = function (executions) {
            var handlers = {},
                newman = {
                    summary: {
                        collection: {
                            name: 'collection-name',
                            id: 'collection-id',
                            forEachItem: function (cb) {
                                cb({ id: 'item-1', name: 'price' });
                            }
                        },
                        run: {
                            executions: executions,
                            stats: { tests: { total: 2 } },
                            timings: { started: Date.now() }
                        }
                    },
                    exports: [],
                    on: function (event, cb) { handlers[event] = cb; }
                };

            JunitReporter(newman, {});
            handlers.beforeDone();

            return newman.exports[0].content;
        },
        executionWith = function (overrides) {
            var base = {
                item: { id: 'item-1' },
                cursor: { iteration: 0 },
                response: { responseTime: 100 },
                assertions: [],
                testScript: [],
                prerequestScript: []
            };

            return Object.assign(base, overrides);
        };

    it('reports top-level AssertionErrors as testcase failures, not system-err', function () {
        var content = runReporter([executionWith({
            assertions: [{
                assertion: 'Response status code is 200',
                error: {
                    name: 'AssertionError',
                    message: 'expected 500 to equal 200',
                    stack: 'AssertionError: expected 500 to equal 200'
                }
            }],
            testScript: [{
                error: {
                    name: 'AssertionError',
                    message: 'error: description of the error',
                    stack: 'AssertionError: error: description of the error'
                }
            }]
        })]);

        expect(content).to.include('failures="2"');
        expect(content).to.include('errors="0"');
        expect(content).to.include('<testcase name="error: description of the error"');
        expect(content).to.include('type="AssertionFailure"');
        expect(content).to.not.include('system-err');
    });

    it('keeps non-assertion script errors in system-err', function () {
        var content = runReporter([executionWith({
            testScript: [{
                error: { name: 'TypeError', message: 'Cannot read property', stack: 'TypeError: Cannot read property' }
            }]
        })]);

        expect(content).to.include('errors="1"');
        expect(content).to.include('system-err');
        expect(content).to.not.include('<failure');
    });
});
