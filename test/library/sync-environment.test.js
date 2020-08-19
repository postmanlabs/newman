let nock = require('nock'),
    sinon = require('sinon'),
    liquidJSON = require('liquid-json'),
    request = require('postman-request'),
    POSTMAN_API_URL = 'https://api.postman.com',

    SAMPLE_ENVIRONMENT_UID = '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
    SAMPLE_ENVIRONMENT_ID = '931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',

    SAMPLE_ENVIRONMENT_URL =
        'https://api.postman.com/environments/931c1484-fd1e-4ceb-81d0-2aa102ca8b5f?apikey=1234',

    SAMPLE_ENVIRONMENT = {
        id: '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
        name: 'Environment',
        values: [{
            key: 'foo',
            type: 'any',
            value: 'bar'
        }]
    },

    SAMPLE_COLLECTION = {
        id: 'C1',
        name: 'Collection C1',
        item: []
    };

describe('sync-environment', function () {
    before(function () {
        nock('https://api.postman.com')
            .persist()
            .put(/^\/environments/)
            .query(true)
            .reply(200, { environment: SAMPLE_ENVIRONMENT });

        nock('https://api.postman.com')
            .persist()
            .get(/^\/environments/)
            .query(true)
            .reply(200, { environment: SAMPLE_ENVIRONMENT });
    });

    after(function () {
        nock.cleanAll();
    });

    beforeEach(function () {
        // spy the `put` function
        sinon.spy(request, 'put');
    });

    afterEach(function () {
        request.put.restore();
    });

    it('should work with an URL with apikey query param', function (done) {
        newman.run({
            collection: SAMPLE_COLLECTION,
            environment: SAMPLE_ENVIRONMENT_URL,
            postmanApiKey: '123456',
            syncEnvironment: true
        }, (err) => {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.put);

            let requestArg = request.put.firstCall.args[0],
                body;

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers', 'body']);
            expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/environments/931c1484-fd1e-4ceb-81d0-2aa102ca8b5f`);
            expect(requestArg.headers).to.be.an('object')
                .that.has.property('Content-Type', 'application/json');
            expect(requestArg.headers['X-Api-Key']).to.equal('1234');

            body = liquidJSON.parse(requestArg.body.trim());
            expect(body).to.eql({ environment: SAMPLE_ENVIRONMENT });

            done();
        });
    });

    it('should work with environment ID', function (done) {
        newman.run({
            collection: SAMPLE_COLLECTION,
            environment: SAMPLE_ENVIRONMENT_ID,
            postmanApiKey: '123456',
            syncEnvironment: true
        }, (err) => {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.put);

            let requestArg = request.put.firstCall.args[0],
                body;

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers', 'body']);
            expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/environments/${SAMPLE_ENVIRONMENT_ID}`);
            expect(requestArg.headers).to.be.an('object')
                .that.has.property('Content-Type', 'application/json');
            expect(requestArg.headers['X-Api-Key']).to.equal('123456');

            body = liquidJSON.parse(requestArg.body.trim());
            expect(body).to.eql({ environment: SAMPLE_ENVIRONMENT });

            done();
        });
    });

    it('should work with environment UID', function (done) {
        newman.run({
            collection: SAMPLE_COLLECTION,
            environment: SAMPLE_ENVIRONMENT_UID,
            postmanApiKey: '123456',
            syncEnvironment: true
        }, (err) => {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.put);

            let requestArg = request.put.firstCall.args[0],
                body;

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers', 'body']);
            expect(requestArg.url).to.equal(`${POSTMAN_API_URL}/environments/${SAMPLE_ENVIRONMENT_UID}`);
            expect(requestArg.headers).to.be.an('object')
                .that.has.property('Content-Type', 'application/json');
            expect(requestArg.headers['X-Api-Key']).to.equal('123456');

            body = liquidJSON.parse(requestArg.body.trim());
            expect(body).to.eql({ environment: SAMPLE_ENVIRONMENT });

            done();
        });
    });

    it('should not sync the environment by default', function (done) {
        newman.run({
            collection: SAMPLE_COLLECTION,
            environment: SAMPLE_ENVIRONMENT_UID,
            postmanApiKey: '123456'
        }, (err) => {
            expect(err).to.be.null;
            sinon.assert.notCalled(request.put);

            done();
        });
    });

    it('should return an error if the environment doesn\'t represent a Postman resource', function (done) {
        newman.run({
            collection: SAMPLE_COLLECTION,
            environment: SAMPLE_ENVIRONMENT,
            postmanApiKey: '123456',
            syncEnvironment: true
        }, (err) => {
            expect(err).to.not.be.null;
            expect(err, 'should indicate the cause of error').to.contain('could not sync environment');

            sinon.assert.notCalled(request.put);

            done();
        });
    });
});
