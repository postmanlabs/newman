const crypt = require('../../lib/crypt'),

    TEXT = 'test123',
    ENCODED_TEXT = ':\u0019.7!Dd3',
    ENCRYPTED_TEXT = '2903611c56b30f2aaf984a6825be5ab3',
    KEY = 'p@s$key',

    TEXT_WITH_ILLEGALS = '123456&',
    ENCODED_TEXT_WITH_ILLEGALS = '\u0018LF3!TlҀ';

describe('Crypt library', function () {
    describe('AES Encryption', function () {
        it('should encrypt data with given the key', function () {
            let encrypted = crypt.encrypt(TEXT, KEY);

            expect(encrypted).to.be.equal(ENCRYPTED_TEXT);
        });

        it('should decrypt with the given key', function () {
            let decrypted = crypt.decrypt(ENCRYPTED_TEXT, KEY);

            expect(decrypted).to.be.equal(TEXT);
        });
    });

    describe('Base 122 Encoding', function () {
        it('should encode text not containing any illegal code points', function () {
            let encoded = crypt.encode(TEXT);

            expect(encoded).to.be.equal(ENCODED_TEXT);
        });

        it('should decode text not containing any illegal code points', function () {
            let decoded = crypt.decode(ENCODED_TEXT);

            expect(decoded).to.be.equal(TEXT);
        });

        it('should encode text containing illegal code points', function () {
            let encoded = crypt.encode(TEXT_WITH_ILLEGALS);

            expect(encoded).to.be.equal(ENCODED_TEXT_WITH_ILLEGALS);
        });

        it('should decode text containing illegal code points', function () {
            let decoded = crypt.decode(ENCODED_TEXT_WITH_ILLEGALS);

            expect(decoded).to.be.equal(TEXT_WITH_ILLEGALS);
        });
    });
});
