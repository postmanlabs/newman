var { Readable } = require('stream'),
    CHUNK_SIZE = 64 * 1024,

    stringify = function (value, space) {
        var indent = typeof space === 'number' ? ' '.repeat(Math.min(10, space)) :
                (typeof space === 'string' ? space.slice(0, 10) : ''),
            stack = [];

        function normalize (item, key) {
            var itemType = typeof item,
                toJSON;

            if (itemType !== 'object' && itemType !== 'function' && itemType !== 'bigint') {
                return item;
            }

            toJSON = itemType === 'object' ? item && item.toJSON : item.toJSON;

            if (typeof toJSON === 'function') {
                return toJSON.call(item, key);
            }

            return item;
        }

        function *serializeString (value) {
            var index,
                end,
                last;

            yield '"';
            for (index = 0; index < value.length;) {
                end = Math.min(index + CHUNK_SIZE, value.length);
                last = value.charCodeAt(end - 1);

                // Keep a valid UTF-16 surrogate pair together when it crosses a chunk boundary.
                if (end < value.length && last >= 0xD800 && last <= 0xDBFF &&
                    value.charCodeAt(end) >= 0xDC00 && value.charCodeAt(end) <= 0xDFFF) {
                    end += 1;
                }
                // JSON.stringify each bounded slice so very long strings never become one large allocation.
                yield JSON.stringify(value.slice(index, end)).slice(1, -1);
                index = end;
            }
            yield '"';
        }

        function *serialize (item, level, key, inArray, normalized) {
            var itemType,
                keys,
                index,
                emitted = 0,
                propertyValue,
                isBoxedBigInt,
                itemIndent = indent.repeat(level),
                childIndent = indent.repeat(level + 1);

            !normalized && (item = normalize(item, key));

            if (item === null || typeof item === 'boolean') {
                yield String(item);

                return;
            }

            itemType = typeof item;
            if (itemType === 'string') {
                yield* serializeString(item);

                return;
            }

            if (itemType === 'number') {
                yield Number.isFinite(item) ? String(item) : 'null';

                return;
            }
            if (itemType === 'object') {
                try {
                    item = Number.prototype.valueOf.call(item);
                    yield Number.isFinite(item) ? String(item) : 'null';

                    return;
                }
                catch (numberValueOfError) { /* Not a boxed Number. */ }
                try {
                    item = String.prototype.valueOf.call(item);
                    yield* serializeString(item);

                    return;
                }
                catch (stringValueOfError) { /* Not a boxed String. */ }
                try {
                    item = Boolean.prototype.valueOf.call(item);
                    yield String(item);

                    return;
                }
                catch (booleanValueOfError) { /* Not a boxed Boolean. */ }
                if (typeof global.BigInt === 'function') {
                    isBoxedBigInt = false;
                    try {
                        global.BigInt.prototype.valueOf.call(item);
                        isBoxedBigInt = true;
                    }
                    catch (bigintValueOfError) { /* Not a boxed BigInt. */ }
                    if (isBoxedBigInt) {
                        throw new TypeError('Do not know how to serialize a BigInt');
                    }
                }
            }
            if (itemType === 'bigint') {
                throw new TypeError('Do not know how to serialize a BigInt');
            }
            if (itemType === 'undefined' || itemType === 'function' || itemType === 'symbol') {
                yield inArray ? 'null' : undefined;

                return;
            }

            if (stack.includes(item)) {
                throw new TypeError('Converting circular structure to JSON');
            }
            stack.push(item);

            if (Array.isArray(item)) {
                yield '[';
                for (index = 0; index < item.length; index += 1) {
                    if (index) {
                        yield ',';
                    }
                    if (indent) {
                        yield '\n' + childIndent;
                    }
                    yield* serialize(item[index], level + 1, String(index), true);
                }
                if (item.length && indent) {
                    yield '\n' + itemIndent;
                }
                yield ']';
            }
            else {
                keys = Object.keys(item);
                yield '{';
                for (index = 0; index < keys.length; index += 1) {
                    propertyValue = normalize(item[keys[index]], keys[index]);
                    if (typeof propertyValue === 'undefined' || typeof propertyValue === 'function' ||
                        typeof propertyValue === 'symbol') {
                        continue;
                    }
                    if (emitted) {
                        yield ',';
                    }
                    emitted += 1;
                    if (indent) {
                        yield '\n' + childIndent;
                    }
                    yield* serializeString(keys[index]);
                    yield indent ? ': ' : ':';
                    yield* serialize(propertyValue, level + 1, keys[index], false, true);
                }
                if (emitted && indent) {
                    yield '\n' + itemIndent;
                }
                yield '}';
            }

            stack.pop();
        }

        function *chunks () {
            var chunk = '',
                part;

            for (part of serialize(value, 0, '', false)) {
                if (typeof part === 'undefined') {
                    continue;
                }
                chunk += part;
                if (chunk.length >= CHUNK_SIZE) {
                    yield chunk;
                    chunk = '';
                }
            }
            if (chunk) {
                yield chunk;
            }
        }

        return Readable.from(chunks());
    };

module.exports = stringify;
