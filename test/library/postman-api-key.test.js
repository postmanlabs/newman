const fs = require('fs'),
    nock = require('nock'),
    sinon = require('sinon'),
    join = require('path').join,
    sh = require('shelljs'),
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
        nock('https://api.postman.com')
            .persist()
            .get(/^\/collections/)
            .reply(200, { collection: COLLECTION });

        nock('https://api.postman.com')
            .persist()
            .get(/^\/environments/)
            .reply(200, { environment: VARIABLE });

        nock('https://example.com')
            .persist()
            .get('/collection.json')
            .reply(200, COLLECTION);
    });

    after(function () {
        nock.cleanAll();
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

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);

            expect(requestArg.url)
                .to.equal('https://api.postman.com/collections/1234-588025f9-2497-46f7-b849-47f58b865807');

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

    it('should fetch collection via ID', function (done) {
        newman.run({
            collection: '588025f9-2497-46f7-b849-47f58b865807',
            postmanApiKey: '12345678'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.get);

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);

            expect(requestArg.url)
                .to.equal('https://api.postman.com/collections/588025f9-2497-46f7-b849-47f58b865807');

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

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);

            expect(requestArg.url)
                .to.equal('https://api.postman.com/environments/1234-931c1484-fd1e-4ceb-81d0-2aa102ca8b5f');

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

    it('should fetch all resources via ID', function (done) {
        newman.run({
            collection: '588025f9-2497-46f7-b849-47f58b865807',
            environment: '931c1484-fd1e-4ceb-81d0-2aa102ca8b5f',
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
            expect(err).to.be.ok.that.match(/No authorization data found/);
            sinon.assert.notCalled(request.get);

            done();
        });
    });

    it('should use API Key from Postman API URL if it contains apikey query-param', function (done) {
        newman.run({
            collection: 'https://api.postman.com/collections?apikey=12345678',
            postmanApiKey: '12345'
        }, function (err, summary) {
            expect(err).to.be.null;
            sinon.assert.calledOnce(request.get);

            let requestArg = request.get.firstCall.args[0];

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'headers']);

            expect(requestArg.url).to.equal('https://api.postman.com/collections');

            expect(requestArg.headers).to.be.an('object')
                .that.has.property('X-Api-Key', '12345678');

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

            expect(requestArg).to.be.an('object').and.include.keys(['url', 'json']);

            expect(requestArg.url).to.equal('https://example.com/collection.json');

            expect(requestArg).to.not.have.property('headers');

            expect(summary.run.failures).to.be.empty;
            expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);

            done();
        });
    });

    describe('read file', function () {
        let outDir = join(__dirname, '..', '..', 'out'),
            UID = '1234-96771253-046f-4ad7-81f9-a2d3c433492b',
            ID = '96771253-046f-4ad7-81f9-a2d3c433492b';

        beforeEach(function () {
            sh.test('-d', outDir) && sh.rm('-rf', outDir);
            sh.mkdir('-p', outDir);
        });

        afterEach(function () {
            sh.rm('-rf', outDir);
        });

        it('should fetch from file having UID name', function (done) {
            fs.writeFileSync(join(outDir, UID), JSON.stringify(COLLECTION));

            newman.run({
                collection: join(outDir, UID),
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

        it('should fetch from file having ID name', function (done) {
            fs.writeFileSync(join(outDir, ID), JSON.stringify(COLLECTION));

            newman.run({
                collection: join(outDir, ID),
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
