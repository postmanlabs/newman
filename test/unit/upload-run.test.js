const { assert } = require('chai');
const request = require('postman-request');
const uploadRunToPostman = require('../../lib/run/upload-run');
let sandbox;

describe.only('Upload Newman Runs to Postman', function () {

    describe('_uploadWithRetry', function () {
        beforeEach(function() {
            sandbox = require('sinon').createSandbox();
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('doesn\'t retry upload if response code is 200', async function () {

            sandbox.stub(request, 'post').yields(null, { statusCode: 200 });
            const uploadToPostman = new uploadRunToPostman();
            const uploadSpy = sandbox.spy(uploadToPostman._upload());
            const retryOptions = {
                maxRetries: 3,
                factor: 2,
                randomize: true,
                maxRetryTimeout: 60,
                maxTimeout: 120
            }

            try {
                await uploadToPostman._uploadWithRetry(uploadSpy, retryOptions)
                assert.isTrue(uploadSpy.calledOnce, 'Upload is retried again after recieving a response code of 2XX');
            } catch (err) { throw new Error(err) }

        });


        it('retries uploading runs if we get 5xx (server side error) response code', async function() {
            const responseBody = {message: '[FAILED - UPLOAD] Failed to upload newman run - Server Side ERROR'};
            sandbox.stub(request, 'post').yields(null, { statusCode: 504 } , responseBody);
            const uploadToPostman = new uploadRunToPostman();
            const uploadSpy = sandbox.spy(uploadToPostman._upload());

            const retryOptions = {
                maxRetries: 4,
                factor: 2,
                randomize: true,
                maxRetryTimeout: 60,
                maxTimeout: 120,
            }

            try {
                await uploadToPostman._uploadWithRetry(uploadSpy, retryOptions)
            } catch (err) {
                assert.include(err, responseBody.message, 'Upload retry failed with wrong error');
                assert.equal(uploadSpy.callCount , retryOptions.maxRetries + 1, `Newman run uploads retry count is not correct`);
            }
        });

        it('doesn\'t retry if we get a 404 from postman server while uploading results', async function(){
            sandbox.stub(request, 'post').yields(null, { statusCode: 404 });
            const uploadToPostman = new uploadRunToPostman();
            const uploadSpy = sandbox.spy(uploadToPostman._upload());
            const retryOptions = {
                maxRetries: 3,
                factor: 2,
                randomize: true,
                maxRetryTimeout: 60,
                maxTimeout: 120
            }

            try {
                await uploadToPostman._uploadWithRetry(uploadSpy, retryOptions)
            } catch (err) {
                assert.isTrue(uploadSpy.calledOnce, 'Upload is retried again after recieving a response code of 404');
                assert.equal(err.message, 'Couldn\'t find the postman server route', 'Upload Run Error message was not correct');
            }
        })

        // 401 / 403 will be raised when the PostmanAPIKey is incorrect / workspace permission upload permission not there
        it('doesn\'t retry uploads if we get 4XX ( client side error)', async function() {
            const errorMessage = {message: 'User doesn\'t have upload permission for the workspace'}
            sandbox.stub(request, 'post').yields(null, { statusCode: 401 }, errorMessage);
            const uploadToPostman = new uploadRunToPostman();
            const uploadSpy = sandbox.spy(uploadToPostman._upload());
            const retryOptions = {
                maxRetries: 3,
                factor: 2,
                randomize: true,
                maxRetryTimeout: 60,
                maxTimeout: 120
            }

            try {
                await uploadToPostman._uploadWithRetry(uploadSpy, retryOptions)
            } catch (err) {
                assert.isTrue(uploadSpy.calledOnce, 'Upload is retried again after recieving a response code of 401 - UNAUTHORIZED');
                assert.equal(err.message, errorMessage.message, 'Upload Run Error message was not correct');
            }
        });

        it('retries uploads when there is a network error(ECONNREFUSED) from client side', async function(){
            const errorMessage = {code: 'ECONNREFUSED' ,message: 'ECONNREFUSED - Network Error'}
            sandbox.stub(request, 'post').yields(errorMessage, { statusCode: 401 });
            const uploadToPostman = new uploadRunToPostman();
            const uploadSpy = sandbox.spy(uploadToPostman._upload());
            const retryOptions = {
                maxRetries: 3,
                factor: 2,
                randomize: true,
                maxRetryTimeout: 60,
                maxTimeout: 120
            }

            try {
                await uploadToPostman._uploadWithRetry(uploadSpy, retryOptions)
            } catch (err) {
                assert.equal(uploadSpy.callCount , retryOptions.maxRetries + 1, 'Upload is retried again after recieving a response code of 401 - UNAUTHORIZED');
                assert.equal(err.message, errorMessage.message, 'Upload Run Error message was not correct');
            }
        });
    });

    describe('Upload Runs to Postman', function () {
        this.beforeEach(function() {
            sandbox = require('sinon').createSandbox();
        });


        this.afterEach(function() {
            sandbox.restore();
        });

        it('doesn\'t upload if publishWorkspace param is NOT present', async function (){
            const uploadConfig = {
                postmanApiKey: 'randomAPIKey'
            },
            uploadToPostman = new uploadRunToPostman(uploadConfig),
            uploadRetrySpy = sandbox.spy(uploadToPostman._uploadWithRetry);

            const uploadStatus = await uploadToPostman.start();

            assert.isTrue(uploadRetrySpy.notCalled, 'We cannot upload newman run if dont have publishWorkspace param');
            assert.isTrue(uploadStatus);
        });

        it('doesn\'t upload if postman-api-key param is NOT present', async function(){
            const uploadConfig = {
                publishWorkspace: 'randomWorkspaceID'
            },
            uploadToPostman = new uploadRunToPostman(uploadConfig),
            uploadRetrySpy = sandbox.spy(uploadToPostman._uploadWithRetry);

            const exitCode = await uploadToPostman.start();

            assert.isTrue(uploadRetrySpy.notCalled, 'We cannot upload newman run if dont have publishWorkspace param');
            assert.isFalse(exitCode, 'Newman should exit with a 1 if we dont have a postmanApiKey param');
        });

    });

    describe('Run Object Adapter', function () {
        // @TODO - After discussing the structure with Harsh
    });
});
