const keytar = require('keytar');

describe('login-logout', function () {
    const SERVICE = 'newman',
        USER = process.env.USER || 'user'; // eslint-disable-line no-process-env

    describe('login', function () {
        const MESSAGE = 'A non-empty apiKey string is needed in the options';

        afterEach(function (done) {
            keytar
                .deletePassword(SERVICE, USER)
                .then(() => { done(); }, done)
                .catch(done);
        });

        it('should handle falsy api keys correctly', function (done) {
            newman.login({}, (err) => {
                expect(err).to.be.an.instanceOf(Error).with.property('message', MESSAGE);
                done();
            });
        });

        it('should handle non-string api keys correctly', function (done) {
            newman.login({ apiKey: 1 }, (err) => {
                expect(err).to.be.an.instanceOf(Error).with.property('message', MESSAGE);
                done();
            });
        });

        it('should work correctly for valid parameters', function (done) {
            const apiKey = 'super-secret-postman-api-key';

            newman.login({ apiKey }, (err, result) => {
                expect(err).not.to.be.ok;
                expect(result).to.eql({ success: true });

                keytar
                    .getPassword(SERVICE, USER)
                    .then((result) => {
                        expect(result).to.equal(apiKey);
                        done();
                    }, done)
                    .catch(done);
            });
        });
    });

    describe('logout', function () {
        beforeEach(function (done) {
            keytar
                .deletePassword(SERVICE, USER)
                .then(() => { done(); }, done)
                .catch(done);
        });

        it('should not blow up for non existent credentials', function (done) {
            newman.logout((err, result) => {
                expect(err).not.to.be.ok;
                expect(result).to.eql({ success: false });
                done();
            });
        });

        it('should correctly log existing users out', function (done) {
            const apiKey = 'super-secret-postman-api-key';

            keytar
                .setPassword(SERVICE, USER, apiKey)
                .then(() => {
                    newman.logout((err, result) => {
                        expect(err).not.to.be.ok;
                        expect(result).to.eql({ success: true });
                        done();
                    });
                }, done)
                .catch(done);
        });
    });
});
