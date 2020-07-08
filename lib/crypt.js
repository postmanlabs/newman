// Code for Base-122 encoding/decoding adapted from the following repo:
// https://github.com/kevinAlbs/Base122

const crypto = require('crypto'),

    ENCRYPTION_ALGORITHM = 'aes256',
    ENCRYPTION_INPUT_ENCODING = 'utf8',
    ENCRYPTION_OUTPUT_ENCODING = 'hex',

    // a 16-byte buffer filled with zeroes used as the initialization vector for encryption
    INITIALIZATION_VECTOR = Buffer.alloc(16),

    // illegal unicode code point values which are encoded in two bytes in Base-122 encoding
    illegals = [
        0, // null
        10, // newline
        13, // carriage return
        34, // double quote
        38, // ampersand
        92 // backslash
    ];

module.exports = {
    /**
     * Encrypt the data with AES Encryption using the key
     *
     * @param {String} data - The raw data
     * @param {String} key - The key for encryption
     * @returns {String} The encrypted data
     */
    encrypt: (data, key) => {
        // since AES-256 encryption takes key of size 256, hash the key using SHA-256
        key = crypto.createHash('sha256').update(key, 'utf8').digest();
        var cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, INITIALIZATION_VECTOR);

        data = cipher.update(data, ENCRYPTION_INPUT_ENCODING, ENCRYPTION_OUTPUT_ENCODING);
        data += cipher.final(ENCRYPTION_OUTPUT_ENCODING);

        return data;
    },

    /**
     * Decrypt the data using the key
     *
     * @param {String} data - The encrypted data
     * @param {String} key - The key for decryption
     * @returns {String} The raw data
     */
    decrypt: (data, key) => {
        key = crypto.createHash('sha256').update(key, 'utf8').digest();
        var decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, INITIALIZATION_VECTOR);

        data = decipher.update(data, ENCRYPTION_OUTPUT_ENCODING, ENCRYPTION_INPUT_ENCODING);
        data += decipher.final(ENCRYPTION_INPUT_ENCODING);

        return data;
    },

    /**
     * Encodes raw data into its base-122 value.
     *
     * @param {String} data - The string to be encoded.
     * @returns {String} The base-122 encoded string.
     */
    encode: (data) => {
        let curIndex = 0,
            curBit = 0, // Points to current bit needed
            utf8Data = [],
            shortened = 0b111,

            getByte = (i) => { return data.codePointAt(i); },

            // Gets seven bits of input data.
            getSevenBits = () => {
            // Shift, mask, unshift to get first part.
                let firstByte = getByte(curIndex),
                    firstPart = ((0b11111110 >>> curBit) & firstByte) << curBit,
                    secondByte,
                    secondPart;

                // Align it to a seven bit chunk.
                firstPart >>= 1;
                curBit += 7;

                // Check if we need to go to the next byte for more bits.
                if (curBit < 8) { return firstPart; }

                curBit -= 8;
                curIndex++;

                // Now we want bits [0..curBit] of the next byte if it exists.
                if (curIndex >= data.length) { return firstPart; }

                secondByte = getByte(curIndex);
                secondPart = ((0xFF00 >>> curBit) & secondByte) & 0xFF;

                // Align it.
                secondPart >>= 8 - curBit;

                return firstPart | secondPart;
            };

        while (curIndex < data.length) {
            // Grab 7 bits.
            let bits = getSevenBits(),

                illegalIndex = illegals.indexOf(bits);

            if (illegalIndex !== -1) {
                // We need to encode this in two bytes.

                let b1 = 0b11000010,
                    b2 = 0b10000000,
                    nextBits,
                    firstBit;

                if (curIndex < data.length) {
                    b1 |= (0b111 & shortened) << 2;
                    nextBits = bits; // Encode these bits after the shortened signifier.
                }
                else {
                    nextBits = getSevenBits();
                    b1 |= (0b111 & illegalIndex) << 2;
                }

                // Push first bit onto first byte, remaining 6 onto second.
                firstBit = (nextBits & 0b01000000) > 0 ? 1 : 0;

                b1 |= firstBit;
                b2 |= nextBits & 0b00111111;
                utf8Data.push(b1);
                utf8Data.push(b2);
            }
            else {
                utf8Data.push(bits);
            }
        }

        return Buffer.from(utf8Data).toString('utf-8');
    },

    /**
     * Decodes base-122 encoded data back to the original data.
     *
     * @param {String} data - The base-122 encoded string.
     * @returns {String} The decoded string.
     */
    decode: (data) => {
        let decoded = [],
            curByte = 0,
            bitOfByte = 0,
            shortened = 0b111,

            pushSevenBits = (byte) => {
                byte <<= 1;
                curByte |= (byte >>> bitOfByte); // Align this byte to offset for current byte.
                bitOfByte += 7;

                if (bitOfByte >= 8) {
                    decoded.push(curByte);
                    bitOfByte -= 8;

                    // Now, take the remainder, left shift by what has been taken.
                    curByte = (byte << (7 - bitOfByte)) & 255;
                }
            };

        for (let i = 0; i < data.length; i++) {
            let c = data.charCodeAt(i);

            // Check if this is a two-byte character.
            if (c > 127) {
                // Note, the charCodeAt will give the codePoint, thus
                // 0b110xxxxx 0b10yyyyyy will give => xxxxxyyyyyy
                let illegalIndex = (c >>> 8) & 7;

                // We have to first check if this is a shortened two-byte character, i.e. if it only
                // encodes <= 7 bits.
                if (illegalIndex !== shortened) { pushSevenBits(illegals[illegalIndex]); }

                pushSevenBits(c & 127); // Always push the rest.
            }
            else {
                pushSevenBits(c); // One byte characters can be pushed directly.
            }
        }

        return Buffer.from(decoded).toString('utf-8');
    }
};
