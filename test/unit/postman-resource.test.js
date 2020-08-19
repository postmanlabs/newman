let nock = require('nock'),
    sinon = require('sinon'),
    request = require('postman-request'),
    liquidJSON = require('liquid-json'),
    PostmanResource = require('../../lib/api').PostmanResource,
    COLLECTION = {
        id: 'C1',
        name: 'Collection',
        item: [{
            id: 'ID1',
            name: 'R1',
            request: 'https://postman-echo.com/get'
        }]
    },
    ENVIRONMENT = {
        id: 'E1',
        name: 'Environment',
        values: [{
            key: 'foo',
            value: 'bar'
        }]
    },

    POSTMAN_API_URL = 'https://api.postman.com',
    SAMPLE_POSTMAN_UID = '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
    SAMPLE_POSTMAN_ID = '931c1484-fd1e-4ceb-81d0-2aa102ca8b5f';

describe('PostmanResource class', function () {
    let request_sandbox = sinon.createSandbox(),
        responseCode, response;

    before(function () {
        nock(POSTMAN_API_URL)
            .persist()
            .get(/^\/collections\/.*/)
            .reply(200, { collection: COLLECTION });

        nock(POSTMAN_API_URL)
            .persist()
            .get(/^\/environments\/.*/)
            .reply(() => {
                return [responseCode, response];
            });

        nock(POSTMAN_API_URL)
            .persist()
            .put(/^\/collections\/.*/)
            .reply(200, { collection: COLLECTION });

        nock(POSTMAN_API_URL)
            .persist()
            .put(/^\/environments\/.*/)
            .reply(() => {
                return [responseCode, response];
            });

        nock(POSTMAN_API_URL)
            .persist()
            .delete(/^\/collections\/.*/)
            .reply(200, { collection: COLLECTION });
    });

    after(function () {
        nock.restore();
    });

    afterEach(function () {
        request_sandbox.restore();
    });

    describe('get', function () {
        beforeEach(function () {
            // spy the `get` function
            request_sandbox.spy(request, 'get');
        });

        it('should fetch a resource from its URL', function (done) {
            let postmanCollection = new PostmanResource('collection', `${POSTMAN_API_URL}/collections/1234`, '1234');

            postmanCollection.get((err, collection) => {
                expect(err).to.be.null;
                expect(collection).to.eql(COLLECTION);

                request_sandbox.assert.calledOnce(request.get);

                let requestArg = request.get.firstCall.args[0];

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);
                expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/collections/1234`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('X-Api-Key', '1234');
                done();
            });
        });

        it('should fetch a resource from its ID', function (done) {
            let postmanEnvironment = new PostmanResource('environment', SAMPLE_POSTMAN_ID, '1234');

            responseCode = 200;
            response = { environment: ENVIRONMENT };

            postmanEnvironment.get((err, environment) => {
                expect(err).to.be.null;
                expect(environment).to.eql(ENVIRONMENT);

                request_sandbox.assert.calledOnce(request.get);

                let requestArg = request.get.firstCall.args[0];

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);
                expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/environments/${SAMPLE_POSTMAN_ID}`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('X-Api-Key', '1234');
                done();
            });
        });

        it('should pass the error from response body if the response code is not of the form 2xx', function (done) {
            let postmanEnvironment = new PostmanResource('environment',
                `https://api.postman.com/environments/${SAMPLE_POSTMAN_UID}`, '1234');

            responseCode = 401;
            response = {
                error: {
                    message: 'Invalid API Key. Every request requires a valid API Key to be sent.'
                }
            };

            postmanEnvironment.get((err) => {
                expect(err).not.to.be.null;
                expect(err.message).to.contain(response.error.message);
                expect(err.help, 'help should contain the type of operation done').to.contain('fetch');

                request_sandbox.assert.calledOnce(request.get);

                let requestArg = request.get.firstCall.args[0];

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);
                expect(requestArg.url).to.equal(`https://api.postman.com/environments/${SAMPLE_POSTMAN_UID}`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('X-Api-Key', '1234');

                done();
            });
        });

        it('should use the cached data on repetitive calls', function (done) {
            let postmanCollection = new PostmanResource('collection', `${POSTMAN_API_URL}/collections/1234`, '1234');

            postmanCollection.get((err, collection) => {
                expect(err).to.be.null;
                expect(collection).to.eql(COLLECTION);

                request_sandbox.assert.calledOnce(request.get);

                let requestArg = request.get.firstCall.args[0];

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);
                expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/collections/1234`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('X-Api-Key', '1234');

                postmanCollection.get((err, collection) => {
                    expect(err).to.be.null;
                    expect(collection).to.eql(COLLECTION);

                    request_sandbox.assert.calledOnce(request.get);
                    done();
                });
            });
        });
    });

    describe('update', function () {
        beforeEach(function () {
            // spy the `put` function
            request_sandbox.spy(request, 'put');
        });

        it('should update a resource from its URL', function (done) {
            let postmanEnvironment = new PostmanResource('environment',
                `https://api.postman.com/environments/${SAMPLE_POSTMAN_UID}`, '123456');

            responseCode = 200;

            postmanEnvironment.update(ENVIRONMENT, (err) => {
                expect(err).to.be.null;
                expect(postmanEnvironment.data, 'should update the cached data').to.eql(ENVIRONMENT);

                request_sandbox.assert.calledOnce(request.put);

                let requestArg = request.put.firstCall.args[0],
                    body;

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers', 'body']);
                expect(requestArg.url).to.equal(`https://api.postman.com/environments/${SAMPLE_POSTMAN_UID}`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('Content-Type', 'application/json');
                expect(requestArg.headers['X-Api-Key']).to.equal('123456');

                body = liquidJSON.parse(requestArg.body.trim());
                expect(body).to.eql({ environment: ENVIRONMENT });

                done();
            });
        });

        it('should update a resource from its UID', function (done) {
            let postmanCollection = new PostmanResource('collection', SAMPLE_POSTMAN_UID, '1234');

            postmanCollection.update(COLLECTION, (err) => {
                expect(err).to.be.null;
                expect(postmanCollection.data, 'should update the cached data').to.eql(COLLECTION);

                request_sandbox.assert.calledOnce(request.put);

                let requestArg = request.put.firstCall.args[0],
                    body;

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers', 'body']);
                expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/collections/${SAMPLE_POSTMAN_UID}`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('Content-Type', 'application/json');
                expect(requestArg.headers['X-Api-Key']).to.equal('1234');

                body = liquidJSON.parse(requestArg.body.trim());
                expect(body).to.eql({ collection: COLLECTION });

                done();
            });
        });

        it('should pass the error from response body if the response code is not of the form 2xx', function (done) {
            let postmanEnvironment = new PostmanResource('environment',
                `https://api.postman.com/environments/${SAMPLE_POSTMAN_UID}`, '1234');

            responseCode = 401;
            response = {
                error: {
                    message: 'Invalid API Key. Every request requires a valid API Key to be sent.'
                }
            };

            postmanEnvironment.update(ENVIRONMENT, (err) => {
                expect(err).not.to.be.null;
                expect(err.message).to.contain(response.error.message);
                expect(err.help, 'help should contain the type of operation done').to.contain('sync');

                request_sandbox.assert.calledOnce(request.put);

                let requestArg = request.put.firstCall.args[0],
                    body;

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers', 'body']);
                expect(requestArg.url).to.equal(`https://api.postman.com/environments/${SAMPLE_POSTMAN_UID}`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('Content-Type', 'application/json');
                expect(requestArg.headers['X-Api-Key']).to.equal('1234');

                body = liquidJSON.parse(requestArg.body.trim());
                expect(body).to.eql({ environment: ENVIRONMENT });

                done();
            });
        });
    });

    describe('delete', function () {
        beforeEach(function () {
            // spy the `delete` function
            request_sandbox.spy(request, 'delete');
        });

        it('should delete a resource from its ID', function (done) {
            let postmanCollection = new PostmanResource('collection', `${SAMPLE_POSTMAN_ID}`, '1234');

            postmanCollection.delete((err) => {
                expect(err).to.be.null;

                request_sandbox.assert.calledOnce(request.delete);

                let requestArg = request.delete.firstCall.args[0];

                expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);
                expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/collections/${SAMPLE_POSTMAN_ID}`);
                expect(requestArg.headers).to.be.an('object')
                    .that.has.property('X-Api-Key', '1234');
                done();
            });
        });
    });
});
