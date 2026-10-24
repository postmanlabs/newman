var { EventEmitter } = require('events'),
    expect = require('chai').expect,
    reporter = require('../../lib/reporters/json'),
    stringify = require('../../lib/reporters/json/stringify');

describe('JSON reporter', function () {
    it('streams the summary as pretty-printed JSON', function (done) {
        var newman = new EventEmitter(),
            summary = { run: { stats: { requests: { total: 1 } } } },
            chunks = [];

        newman.exports = [];
        reporter(newman, {});
        newman.emit('beforeDone', null, { summary });

        expect(newman.exports[0].content).to.have.property('pipe');

        newman.exports[0].content.on('data', function (chunk) { chunks.push(chunk); });
        newman.exports[0].content.on('end', function () {
            expect(chunks.join('')).to.equal(JSON.stringify(summary, 0, 2));
            done();
        });
        newman.exports[0].content.on('error', done);
    });

    it('serializes long response bodies in bounded string chunks', function (done) {
        var body = 'x'.repeat(128 * 1024),
            stream = stringify({ response: { body } }, 2),
            chunks = [];

        stream.on('data', function (chunk) { chunks.push(chunk); });
        stream.on('end', function () {
            expect(chunks.join('')).to.equal(JSON.stringify({ response: { body } }, 0, 2));
            done();
        });
        stream.on('error', done);
    });

    it('keeps surrogate pairs intact across string chunk boundaries', function (done) {
        var body = 'x'.repeat(64 * 1024 - 1) + '😀',
            stream = stringify({ response: { body } }, 2),
            chunks = [];

        stream.on('data', function (chunk) { chunks.push(chunk); });
        stream.on('end', function () {
            expect(chunks.join('')).to.equal(JSON.stringify({ response: { body } }, 0, 2));
            done();
        });
        stream.on('error', done);
    });

    it('serializes properties in getter and toJSON evaluation order', function (done) {
        var order = [],
            summary = {
                get first () {
                    order.push('first getter');

                    return {
                        toJSON () {
                            order.push('first toJSON');

                            return 1;
                        }
                    };
                },
                get second () {
                    order.push('second getter');

                    return 2;
                }
            },
            stream = stringify(summary, 2);

        stream.resume();
        stream.on('end', function () {
            expect(order).to.eql(['first getter', 'first toJSON', 'second getter']);
            done();
        });
        stream.on('error', done);
    });

    it('omits unsupported object properties without leading commas', function (done) {
        var summary = {
                omittedUndefined: undefined,
                omittedFunction: function () { return true; },
                omittedSymbol: Symbol('omitted'),
                included: 1
            },
            stream = stringify(summary, 2),
            chunks = [];

        stream.on('data', function (chunk) { chunks.push(chunk); });
        stream.on('end', function () {
            expect(chunks.join('')).to.equal(JSON.stringify(summary, 0, 2));
            done();
        });
        stream.on('error', done);
    });

    it('reads a toJSON getter once per value', function (done) {
        var getterCalls = 0,
            value = {
                get toJSON () {
                    getterCalls += 1;

                    return function () { return 'serialized'; };
                }
            },
            stream = stringify({ value }, 2);

        stream.resume();
        stream.on('end', function () {
            expect(getterCalls).to.equal(1);
            done();
        });
        stream.on('error', done);
    });

    /* eslint-disable no-extend-native */
    it('does not call toJSON on primitive strings', function (done) {
        var originalDescriptor = Object.getOwnPropertyDescriptor(String.prototype, 'toJSON'),
            summary = { value: 'text' },
            stream,
            chunks = [];

        Object.defineProperty(String.prototype, 'toJSON', {
            configurable: true,
            value: function () { return 'changed'; },
            writable: true
        });
        stream = stringify(summary, 2);

        stream.on('data', function (chunk) { chunks.push(chunk); });
        stream.on('end', function () {
            if (originalDescriptor) {
                Object.defineProperty(String.prototype, 'toJSON', originalDescriptor);
            }
            else {
                delete String.prototype.toJSON;
            }
            expect(chunks.join('')).to.equal(JSON.stringify(summary, 0, 2));
            done();
        });
        stream.on('error', function (err) {
            if (originalDescriptor) {
                Object.defineProperty(String.prototype, 'toJSON', originalDescriptor);
            }
            else {
                delete String.prototype.toJSON;
            }
            done(err);
        });
    });
    /* eslint-enable no-extend-native */

    it('serializes boxed primitives like JSON.stringify', function (done) {
        var summary = {
                number: Object(1),
                string: Object('text'),
                boolean: Object(false),
                ordinary: { value: 2 }
            },
            stream = stringify(summary, 2),
            chunks = [];

        stream.on('data', function (chunk) { chunks.push(chunk); });
        stream.on('end', function () {
            expect(chunks.join('')).to.equal(JSON.stringify(summary, 0, 2));
            done();
        });
        stream.on('error', done);
    });

    (typeof global.BigInt === 'function') && it('rejects boxed BigInt like JSON.stringify', function (done) {
        var summary = { value: Object(global.BigInt(1)) },
            stream = stringify(summary, 2);

        expect(function () { JSON.stringify(summary); }).to.throw(TypeError);
        stream.on('error', function (err) {
            expect(err).to.be.instanceOf(TypeError);
            done();
        });
        stream.resume();
        stream.on('end', done);
    });
});
