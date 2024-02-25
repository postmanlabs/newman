const expect = require('chai').expect,
    nock = require('nock'),
    newman = require('../../../'),
    {
        POSTMAN_API_BASE_URL,
        POSTMAN_API_UPLOAD_PATH,
        RESPONSE_FALLBACK_ERROR_MESSAGE
    } = require('../../../lib/reporters/postman/helpers/constants'),
    { uploadRun } = require('../../../lib/reporters/postman/helpers/upload-run'),
    collectionRunOptions = require('../../fixtures/postman-reporter/collection-run-options.json'),
    collection = require('../../fixtures/postman-reporter/newman.postman_collection.json');


describe('uploadRun', function () {
    it('should reject if runSummary is missing', function (done) {
        uploadRun('PMAK-123', collectionRunOptions, null, (err) => {
            expect(err).to.be.ok;
            expect(err.message).to.equal('runSummary is a required parameter to upload run data');

            return done();
        });
    });

    it('should reject with the error received when the server returns a 4xx response', function (done) {
        nock(POSTMAN_API_BASE_URL)
            .post(POSTMAN_API_UPLOAD_PATH)
            .reply(400, {
                processorErrorBody: {
                    message: 'Error message'
                }
            });

        newman.run({ collection }, (err, runSummary) => {
            if (err) {
                return done(err);
            }

            uploadRun('PMAK-123', collectionRunOptions, runSummary, (err) => {
                expect(err).to.be.ok;
                expect(err.message).to.equal('Error message');

                return done();
            });
        });
    });

    it('should reject with a generic error when the server returns a 5xx response', function (done) {
        nock(POSTMAN_API_BASE_URL)
            .post(POSTMAN_API_UPLOAD_PATH)
            .reply(500, {
                error: {
                    message: 'Something went wrong with the server'
                }
            });

        newman.run({ collection }, (err, runSummary) => {
            if (err) {
                return done(err);
            }

            uploadRun('PMAK-123', collectionRunOptions, runSummary, (err) => {
                expect(err).to.be.ok;
                expect(err.message).to.equal(RESPONSE_FALLBACK_ERROR_MESSAGE);

                return done();
            });
        });
    });

    it('should resolve with a successful response received from server', function (done) {
        nock(POSTMAN_API_BASE_URL, {
            reqheaders: {
                'content-type': 'application/json',
                accept: 'application/vnd.postman.v2+json',
                'x-api-key': 'PMAK-123'
            }
        })
            .post(POSTMAN_API_UPLOAD_PATH)
            .reply(200, {
                result: true,
                url: 'https://go.postman.co/collection-runs/123456789'
            });

        newman.run({ collection }, (err, runSummary) => {
            if (err) {
                return done(err);
            }

            uploadRun('PMAK-123', collectionRunOptions, runSummary, (err, response) => {
                if (err) {
                    return done(err);
                }

                expect(response).to.eql({
                    result: true,
                    url: 'https://go.postman.co/collection-runs/123456789'
                });

                return done();
            });
        });
    });
});
