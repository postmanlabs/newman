/* eslint-disable max-len */
const sinon = require('sinon'),
    nock = require('nock'),
    newman = require('../../../'),

    print = require('../../../lib/print'),
    upload = require('../../../lib/reporters/postman/helpers/upload-run'),

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
    };


describe('Postman reporter', function () {
    afterEach(function () {
        sinon.restore();
    });

    it('should print informational message if collection is not specified as postman API URL', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/newman-report-test.json -r postman',
            function (code, stdout, stderr) {
                expect(code).be.ok;
                expect(stderr).to.be.empty;
                expect(stdout).to.contain('Publishing run details to postman cloud is currently supported ' +
                    'only for collections specified via postman API link.');
                expect(stdout).to.contain('Refer: ' +
                    'https://github.com/postmanlabs/newman#using-newman-with-the-postman-api');

                done();
            });
    });

    it('should print informational message if api key is not found', function (done) {
        const collectionUID = '1234-588025f9-2497-46f7-b849-47f58b865807',
            apiKey = '',
            collectionPostmanURL = `https://api.getpostman.com/collections/${collectionUID}?apikey=${apiKey}`;

        nock('https://api.getpostman.com')
            .get(/^\/collections/)
            .reply(200, COLLECTION);

        sinon.spy(print, 'lf');

        newman.run({
            collection: collectionPostmanURL,
            reporters: ['postman']
        }, function (err) {
            expect(err).to.be.null;
            expect(print.lf.called).to.be.true;
            expect(print.lf.calledWith('Postman api key is required for publishing run details to postman cloud.\n' +
                'Please specify it by adding an environment variable POSTMAN_API_KEY or ' +
                'using CLI arg: --postman-api-key')).to.be.true;

            return done();
        });
    });

    it('should print the error in case upload run fails', function (done) {
        const collectionUID = '1234-588025f9-2497-46f7-b849-47f58b865807',
            apiKey = '12345678',
            collectionPostmanURL = `https://api.getpostman.com/collections/${collectionUID}?apikey=${apiKey}`;

        nock('https://api.getpostman.com')
            .get(/^\/collections/)
            .reply(200, COLLECTION);

        sinon.stub(upload, 'uploadRun').callsFake((_apiKey, _collectionRunOptions, _runSummary, callback) => {
            return callback(new Error('Error message'));
        });

        sinon.spy(print, 'lf');

        newman.run({
            collection: collectionPostmanURL,
            reporters: ['postman']
        }, function (err) {
            expect(err).to.be.null;
            expect(print.lf.called).to.be.true;
            expect(print.lf.calledWith('Error occurred while uploading newman run data to Postman: Error message')).to.be.true;

            return done();
        });
    });

    it('should pass environment id to server if environment specified as postman API URL', function (done) {
        const collectionUID = '1234-588025f9-2497-46f7-b849-47f58b865807',
            environmentUID = '1234-dd79df3b-9fca-qwdq-dq2w-eab7e5d5d3b3',
            apiKey = '12345678',
            collectionPostmanURL = `https://api.getpostman.com/collections/${collectionUID}?apikey=${apiKey}`,
            environmentPostmanURL = `https://api.getpostman.com/environments/${environmentUID}?apikey=${apiKey}`,
            uploadRunResponse = {
                message: 'Successfully imported newman run',
                requestId: '4bf0e07f-4bed-46fc-aabe-0c5cf89074aa',
                postmanRunUrl: 'https://go.postman.co/workspace/4e43fe74-88c5-4452-a41c-8c24589ba81e/run/1234-e438aa9a-8f16-497d-81dd-e91c298cbc68'
            };

        nock('https://api.getpostman.com')
            .get(/^\/collections/)
            .reply(200, COLLECTION);

        nock('https://api.getpostman.com')
            .get(/^\/environments/)
            .reply(200, ENVIRONMENT);

        sinon.stub(upload, 'uploadRun').callsFake((_apiKey, _collectionRunOptions, _runSummary, callback) => {
            return callback(null, uploadRunResponse);
        });

        sinon.spy(print, 'lf');

        newman.run({
            collection: collectionPostmanURL,
            environment: environmentPostmanURL,
            reporters: ['postman']
        }, function (err) {
            expect(err).to.be.null;
            expect(upload.uploadRun.callCount).to.equal(1);
            expect(upload.uploadRun.args[0][2].environment.id).to.equal(environmentUID);
            expect(print.lf.callCount).to.equal(2);
            expect(print.lf.calledWith('Newman run data uploaded to Postman successfully.')).to.be.true;
            expect(print.lf.calledWith(`You can view the newman run data in Postman at: ${uploadRunResponse.postmanRunUrl}`)).to.be.true;

            return done();
        });
    });

    it('should print the postman url in case upload run succeeds', function (done) {
        const collectionUID = '1234-588025f9-2497-46f7-b849-47f58b865807',
            apiKey = '12345678',
            collectionPostmanURL = `https://api.getpostman.com/collections/${collectionUID}?apikey=${apiKey}`,
            uploadRunResponse = {
                message: 'Successfully imported newman run',
                requestId: '4bf0e07f-4bed-46fc-aabe-0c5cf89074aa',
                postmanRunUrl: 'https://go.postman.co/workspace/4e43fe74-88c5-4452-a41c-8c24589ba81e/run/1234-e438aa9a-8f16-497d-81dd-e91c298cbc68'
            };

        nock('https://api.getpostman.com')
            .get(/^\/collections/)
            .reply(200, COLLECTION);

        sinon.stub(upload, 'uploadRun').callsFake((_apiKey, _collectionRunOptions, _runSummary, callback) => {
            return callback(null, uploadRunResponse);
        });

        sinon.spy(print, 'lf');

        newman.run({
            collection: collectionPostmanURL,
            reporters: ['postman']
        }, function (err) {
            expect(err).to.be.null;
            expect(upload.uploadRun.callCount).to.equal(1);
            expect(upload.uploadRun.args[0][2].environment.id).to.be.undefined;
            expect(print.lf.callCount).to.equal(2);
            expect(print.lf.calledWith('Newman run data uploaded to Postman successfully.')).to.be.true;
            expect(print.lf.calledWith(`You can view the newman run data in Postman at: ${uploadRunResponse.postmanRunUrl}`)).to.be.true;

            return done();
        });
    });
});

