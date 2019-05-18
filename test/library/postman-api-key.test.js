const fs = require('fs'),
    nock = require('nock'),
    sinon = require('sinon'),
    request = require('postman-request'),
    COLLECTION = {
        id: 'C1',
        name: 'Collection',
        item: [{
            id: 'ID1',
            name: 'R1',
            request: 'https://postman-echo.com/get'
        }]
    },
    VARIABLE = {
        id: 'E1',
        name: 'Environment',
        values: [{
            key: 'foo',
            value: 'bar'
        }]
    };

describe('newman.run postmanApiKey', function () {
    before(function () {
        nock('https://api.getpostman.com')
            .persist()
            .get(/^\/collections/)
            .reply(200, COLLECTION);

        nock('https://api.getpostman.com')
            .persist()
            .get(/^\/environments/)
            .reply(200, VARIABLE);

        nock('https://example.com')
            .persist()
            .get('/collection.json')
            .reply(200, COLLECTION);
    });

    after(function () {
        nock.restore();
    });

    beforeEach(function () {
        sinon.spy(request, 'get');
    });

    afterEach(function () {
        request.get.restore();
    });

    it('should fetch collection via UID', function (done) {
        newman.run({
            collection: '1234-588025f9-2497-46f7-b849-47f58b865807',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.get);

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'json', 'headers']);

            expect(requestArg.url)
                .to.equal('https://api.getpostman.com/collections/1234-588025f9-2497-46f7-b849-47f58b865807');

            expect(requestArg.headers).to.be.an('object')
                .that.has.property('X-Api-Key', '12345678');

            expect(summary).to.be.an('object')
                .that.has.property('collection').to.be.an('object')
                .and.include({ id: 'C1', name: 'Collection' });

            expect(summary.run.failures).to.be.empty;
            expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

            done();
        });
    });

    it('should fetch environment via UID', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            environment: '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.get);

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'json', 'headers']);

            expect(requestArg.url)
                .to.equal('https://api.getpostman.com/environments/1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f');

            expect(requestArg.headers).to.be.an('object')
                .that.has.property('X-Api-Key', '12345678');

            expect(summary).to.be.an('object')
                .that.has.property('environment').to.be.an('object')
                .and.include({ id: 'E1', name: 'Environment' });

            expect(summary.run.failures).to.be.empty;
            expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

            done();
        });
    });

    it('should fetch all resources via UID', function (done) {
        newman.run({
            collection: '1234-588025f9-2497-46f7-b849-47f58b865807',
            environment: '1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledTwice(request.get);

            expect(summary).to.be.an('object').and.include.keys(['collection', 'environment', 'globals', 'run']);

            expect(summary.collection).to.include({ id: 'C1', name: 'Collection' });
            expect(summary.environment).to.include({ id: 'E1', name: 'Environment' });

            expect(summary.run.failures).to.be.empty;
            expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

            done();
        });
    });

    it('should end with an error if UID is passed without postmanApiKey and no such file exists', function (done) {
        newman.run({
            collection: '1234-588025f9-2497-46f7-b849-47f58b865807'
        }, function (err) {
            expect(err).to.be.ok.that.match(/no such file or directory/);
            sinon.assert.notCalled(request.get);

            done();
        });
    });

    it('should not pass API Key header for Postman API URLs', function (done) {
        newman.run({
            collection: 'https://api.getpostman.com/collections?apikey=12345678',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.get);

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'json', 'headers']);

            expect(requestArg.url).to.equal('https://api.getpostman.com/collections?apikey=12345678');

            expect(requestArg.headers).to.not.have.property('X-Api-Key');

            expect(summary.run.failures).to.be.empty;
            expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

            done();
        });
    });

    it('should not pass API Key header for non Postman API URLs', function (done) {
        newman.run({
            collection: 'https://example.com/collection.json',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.get);

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'json', 'headers']);

            expect(requestArg.url).to.equal('https://example.com/collection.json');

            expect(requestArg.headers).to.not.have.property('X-Api-Key');

            expect(summary.run.failures).to.be.empty;
            expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

            done();
        });
    });

    describe('read file', function () {
        const UID = '1234-96771253-046f-4ad7-81f9-a2d3c433492b';

        beforeEach(function (done) {
            fs.stat(UID, function (err) {
                if (err) {
                    return fs.writeFile(UID, JSON.stringify(COLLECTION), done);
                }

                done();
            });
        });

        afterEach(function (done) {
            fs.stat(UID, function (err) {
                if (err) { return done(); }

                fs.unlink(UID, done);
            });
        });

        it('should fetch from file having UID name', function (done) {
            newman.run({
                collection: UID,
                postmanApiKey: '12345678'
            }, function (err, summary) {
                expect(err).to.be.null;
                sinon.assert.notCalled(request.get);

                expect(summary).to.be.an('object')
                    .that.has.property('collection').to.be.an('object')
                    .and.include({ id: 'C1', name: 'Collection' });

                expect(summary.run.failures).to.be.empty;
                expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

                done();
            });
        });
    });
});
