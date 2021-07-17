const sinon = require('sinon'),
    runtime = require('postman-runtime');

describe('request module', function () {
    var request = require('../../lib/request'),
        util = require('../../lib/request/util');

    it('should export a function', function () {
        expect(request).to.be.a('function');
    });

    it('should start a request with no url and return error in callback', function (done) {
        expect(function () {
            request(function (err) {
                expect(err).to.be.ok;
                expect(err.message).to.equal('expecting a valid curl command to run');
                done();
            });
        }).to.not.throw();
    });

    it('should start a request with only url', function (done) {
        expect(function () {
            request({ curl: 'curl -X GET "https://postman-echo.com/get"' }, function (err) {
                expect(err).to.eq(null);
                done();
            });
        }).to.not.throw();
    });

    it('should throw an error for unexpected error from curl2postman module', function (done) {
        sinon.stub(util, 'convertCurltoCollection').yields(new Error('fake-crash_curl2postman'));
        expect(function () {
            request({ curl: 'curl -X GET "https://postman-echo.com/get"' }, function (err) {
                expect(err.message).to.equal('fake-crash_curl2postman');
                sinon.restore();
                done();
            });
        }).to.not.throw();
    });

    it('should throw an error for unexpected error from postman-runtime module', function (done) {
        sinon.stub(runtime, 'Runner').prototype.run = (collection, options, callback) => {
            callback(new Error('fake-crash_postman-runtime'));
        };
        expect(function () {
            request({ curl: 'curl -X GET "https://postman-echo.com/get"' }, function (err) {
                expect(err.message).to.equal('fake-crash_postman-runtime');
                sinon.restore();
                done();
            });
        }).to.not.throw();
    });
});
