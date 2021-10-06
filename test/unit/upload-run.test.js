// Replace all assert with expect;

const { assert, expect } = require('chai');
const sinon = require('sinon');
const request = require('postman-request');
const {_upload, _uploadWithRetry, _buildRequestObject, _buildResponseObject, _buildPostmanUploadPayload} = require('../../lib/run/upload-run');
const sdk  = require('postman-collection');
let sandbox;

describe.only('Upload Newman Runs to Postman', function () {

    describe('_uploadWithRetry', function () {
        beforeEach(function() {
            sandbox = sinon.createSandbox();
            this.uploadSpy = sandbox.spy(_upload());

            this.retryOptions = {
                maxRetries: 3,
                factor: 2,
                randomize: true,
                maxRetryTimeout: 60,
                maxTimeout: 120
            }
        });

        afterEach(function () {
            sandbox.restore();

        });

        it('doesn\'t retry upload if response code is 200', async function () {
            sandbox.stub(request, 'post').yields(null, { statusCode: 201 });


            try {
                await _uploadWithRetry(this.uploadSpy, this.retryOptions)
                expect(this.uploadSpy.calledOnce).to.be.true;
            } catch (err) {
                 throw new Error(err);
            }

        });

        it('retries uploading runs if we get 5xx (server side error) response code', async function() {
            const responseBody = {message: '[FAILED - UPLOAD] Failed to upload newman run - Server Side ERROR'};
            sandbox.stub(request, 'post').yields(null, { statusCode: 501 } , responseBody);

            try {
                await _uploadWithRetry(this.uploadSpy, this.retryOptions);
                throw new Error(`Promise was resolved when the server responded with 5xx`);
            } catch (err) {
                expect(err.message).to.includes(responseBody.message,'Upload retry failed with wrong error');
                expect(this.uploadSpy.callCount).to.be.equal(this.retryOptions.maxRetries + 1, `Newman run uploads retry count is not correct`)
            }
        });

        it('doesn\'t retry if we get a 404 from postman server while uploading results', async function(){
            sandbox.stub(request, 'post').yields(null, { statusCode: 404 });

            try {
                await _uploadWithRetry(this.uploadSpy, this.retryOptions);
                throw new Error(`Promise was resolved when the server responded with 404`);
            } catch (err) {
                expect(this.uploadSpy.calledOnce).to.be.true;
                expect(err.message).to.includes('Couldn\'t find the postman server route', 'Upload Run Error message was not correct');
            }
        })

        // 401 / 403 will be raised when the PostmanAPIKey is incorrect / workspace permission upload permission not there
        it('doesn\'t retry uploads if we get 4XX ( client side error)', async function() {
            const errorMessage = {message: 'User doesn\'t have upload permission for the workspace'}
            sandbox.stub(request, 'post').yields(null, { statusCode: 401 }, errorMessage);

            try {
                await _uploadWithRetry(this.uploadSpy, this.retryOptions);
                throw new Error(`Promise was resolved when the server responded with 401`);
            } catch (err) {
                expect(this.uploadSpy.calledOnce).to.be.true;
                expect(err.message).to.includes(errorMessage.message, 'Upload Run Error message was not correct');
            }
        });

        it('retries uploads when there is a network error(ECONNREFUSED) from client side', async function(){
            const errorMessage = {code: 'ECONNREFUSED' ,message: 'ECONNREFUSED - Network Error'}
            sandbox.stub(request, 'post').yields(errorMessage);

            try {
                await _uploadWithRetry(this.uploadSpy, this.retryOptions);
                throw new Error(`Promise was resolved when there was a network error from client side`);
            } catch (err) {
                expect(this.uploadSpy.callCount).to.be.equal(this.retryOptions.maxRetries + 1, `Upload is retried again after recieving a response code of 401 - UNAUTHORIZED`)
                expect(err.message).to.includes(errorMessage.message, 'Upload Run Error message was not correct');
            }
        });
    });

    describe('uploadRunToPostman', function () {

        // @TODO - fix it
        it.skip('it throws correct error when Run Serialiser fails', function(){
            const uploadRetrySpy = sinon.spy(_uploadWithRetry);

            _buildPostmanUploadPayload = sinon.fake.throws(new Error('Unable to parse JSOn at line: xx'));
            expect(uploadRunToPostman).to.throw(Error, 'Unable to serialize the run - Unable to parse JSOn at line: xx');
            expect(uploadRetrySpy.calledOnce).to.be.false;
        });

    });

    describe('_buildPostmanUploadPayload - Run Object Serialiser', function () {

        it('throws when called without runOptions or runSummary', function(){
           expect(_buildPostmanUploadPayload).to.throw(Error, 'Cannot Build Run Payload without runOptions or RunSummary');
        });

        describe('_executionToIterationConverter ', function() {
            before(function(){
                this.executions =  [
                    {
                      "cursor": {
                        "position": 0,
                        "iteration": 0,
                        "length": 2,
                        "cycles": 2,
                        "empty": false,
                        "eof": false,
                        "bof": true,
                        "cr": false,
                        "ref": "39ebe9e0-a7f7-4038-a7de-ad2f53eaa432",
                        "httpRequestId": "9a6b6047-3c11-4ea3-bc6f-2a44b4bb9b87"
                      },
                      "item": {
                        "id": "0328946d-6184-48ee-86d0-8ac91bfd46c7",
                        "name": "postman-echo Request",
                        "request": {
                          "url": {
                            "protocol": "https",
                            "path": [
                              "post"
                            ],
                            "host": [
                              "{{base-url}}"
                            ],
                            "query": [
                              {
                                "key": "foo1",
                                "value": "bar1"
                              },
                              {
                                "key": "foo2",
                                "value": "bar2"
                              }
                            ],
                            "variable": []
                          },
                          "method": "POST",
                          "body": {
                            "mode": "raw",
                            "raw": "{\n        \"foo1\": \"bar1\",\n        \"foo2\": \"bar2\"\n    }",
                            "options": {
                              "raw": {
                                "language": "json"
                              }
                            }
                          }
                        },
                        "response": [],
                        "event": [
                          {
                            "listen": "test",
                            "script": {
                              "id": "ae1cdcc5-c150-4744-b067-2a3fe6cd90a4",
                              "type": "text/javascript",
                              "exec": [
                                "pm.test(\"response is ok\", function () {",
                                "    pm.response.to.have.status(200);",
                                "});",
                                "",
                                "pm.test(\"response body has json with request queries\", function () {",
                                "    pm.response.to.have.jsonBody('args.foo1', 'bar1')",
                                "        .and.have.jsonBody('args.foo2', 'bar2');",
                                "    ",
                                "    pm.response.to.have.jsonBody('data.foo1', 'bar1')",
                                "        .and.have.jsonBody('data.foo2', 'bar2');",
                                "});"
                              ],
                              "_lastExecutionId": "030d6832-2c7e-455b-8f2e-1761f2435b98"
                            }
                          }
                        ]
                      },
                      "request": {
                        "url": {
                          "protocol": "https",
                          "path": [
                            "post"
                          ],
                          "host": [
                            "postman-echo",
                            "com"
                          ],
                          "query": [
                            {
                              "key": "foo1",
                              "value": "bar1"
                            },
                            {
                              "key": "foo2",
                              "value": "bar2"
                            }
                          ],
                          "variable": []
                        },
                        "header": [
                          {
                            "key": "Content-Type",
                            "value": "application/json",
                            "system": true
                          },
                          {
                            "key": "User-Agent",
                            "value": "PostmanRuntime/7.28.4",
                            "system": true
                          },
                          {
                            "key": "Accept",
                            "value": "*/*",
                            "system": true
                          },
                          {
                            "key": "Cache-Control",
                            "value": "no-cache",
                            "system": true
                          },
                          {
                            "key": "Postman-Token",
                            "value": "2a797f93-eeda-4db2-be45-df925178a288",
                            "system": true
                          },
                          {
                            "key": "Host",
                            "value": "postman-echo.com",
                            "system": true
                          },
                          {
                            "key": "Accept-Encoding",
                            "value": "gzip, deflate, br",
                            "system": true
                          },
                          {
                            "key": "Connection",
                            "value": "keep-alive",
                            "system": true
                          },
                          {
                            "key": "Content-Length",
                            "value": "54",
                            "system": true
                          }
                        ],
                        "method": "POST",
                        "body": {
                          "mode": "raw",
                          "raw": "{\n        \"foo1\": \"bar1\",\n        \"foo2\": \"bar2\"\n    }",
                          "options": {
                            "raw": {
                              "language": "json"
                            }
                          }
                        }
                      },
                      "response": {
                        "id": "a3c005e3-ef63-4e59-bfbd-20c7c77b9760",
                        "status": "OK",
                        "code": 200,
                        "header": [
                          {
                            "key": "Date",
                            "value": "Wed, 06 Oct 2021 08:56:51 GMT"
                          },
                          {
                            "key": "Content-Type",
                            "value": "application/json; charset=utf-8"
                          },
                          {
                            "key": "Content-Length",
                            "value": "571"
                          },
                          {
                            "key": "Connection",
                            "value": "keep-alive"
                          },
                          {
                            "key": "ETag",
                            "value": "W/\"23b-AlzjayQwNO+Woyir9Mp9xerSIBc\""
                          },
                          {
                            "key": "Vary",
                            "value": "Accept-Encoding"
                          },
                          {
                            "key": "set-cookie",
                            "value": "sails.sid=s%3AXohwDMNej6EuzZ3MGUMeS3bfQ4fm8mgV.Uhhexk51B7vd5FGKwpA1L05FHL%2BZl%2FnnstEp3qCxQ4Y; Path=/; HttpOnly"
                          }
                        ],
                        "stream": {
                          "type": "Buffer",
                          "data": [
                            123, 34, 97, 114, 103, 115, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125, 44, 34, 100, 97, 116, 97, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125, 44, 34, 102, 105, 108, 101, 115, 34, 58, 123, 125, 44, 34, 102, 111, 114, 109, 34, 58, 123, 125, 44, 34, 104, 101, 97, 100, 101, 114, 115, 34, 58, 123, 34, 120, 45, 102, 111, 114, 119, 97, 114, 100, 101, 100, 45, 112, 114, 111, 116, 111, 34, 58, 34, 104, 116, 116, 112, 115, 34, 44, 34, 120, 45, 102, 111, 114, 119, 97, 114, 100, 101, 100, 45, 112, 111, 114, 116, 34, 58, 34, 52, 52, 51, 34, 44, 34, 104, 111, 115, 116, 34, 58, 34, 112, 111, 115, 116, 109, 97, 110, 45, 101, 99, 104, 111, 46, 99, 111, 109, 34, 44, 34, 120, 45, 97, 109, 122, 110, 45, 116, 114, 97, 99, 101, 45, 105, 100, 34, 58, 34, 82, 111, 111, 116, 61, 49, 45, 54, 49, 53, 100, 54, 52, 100, 51, 45, 55, 52, 56, 56, 53, 101, 97, 52, 54, 50, 54, 98, 56, 52, 99, 99, 53, 102, 53, 57, 55, 57, 55, 54, 34, 44, 34, 99, 111, 110, 116, 101, 110, 116, 45, 108, 101, 110, 103, 116, 104, 34, 58, 34, 53, 52, 34, 44, 34, 99, 111, 110, 116, 101, 110, 116, 45, 116, 121, 112, 101, 34, 58, 34, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 34, 44, 34, 117, 115, 101, 114, 45, 97, 103, 101, 110, 116, 34, 58, 34, 80, 111, 115, 116, 109, 97, 110, 82, 117, 110, 116, 105, 109, 101, 47, 55, 46, 50, 56, 46, 52, 34, 44, 34, 97, 99, 99, 101, 112, 116, 34, 58, 34, 42, 47, 42, 34, 44, 34, 99, 97, 99, 104, 101, 45, 99, 111, 110, 116, 114, 111, 108, 34, 58, 34, 110, 111, 45, 99, 97, 99, 104, 101, 34, 44, 34, 112, 111, 115, 116, 109, 97, 110, 45, 116, 111, 107, 101, 110, 34, 58, 34, 50, 97, 55, 57, 55, 102, 57, 51, 45, 101, 101, 100, 97, 45, 52, 100, 98, 50, 45, 98, 101, 52, 53, 45, 100, 102, 57, 50, 53, 49, 55, 56, 97, 50, 56, 56, 34, 44, 34, 97, 99, 99, 101, 112, 116, 45, 101, 110, 99, 111, 100, 105, 110, 103, 34, 58, 34, 103, 122, 105, 112, 44, 32, 100, 101, 102, 108, 97, 116, 101, 44, 32, 98, 114, 34, 125, 44, 34, 106, 115, 111, 110, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125, 44, 34, 117, 114, 108, 34, 58, 34, 104, 116, 116, 112, 115, 58, 47, 47, 112, 111, 115, 116, 109, 97, 110, 45, 101, 99, 104, 111, 46, 99, 111, 109, 47, 112, 111, 115, 116, 63, 102, 111, 111, 49, 61, 98, 97, 114, 49, 38, 102, 111, 111, 50, 61, 98, 97, 114, 50, 34, 125
                          ]
                        },
                        "cookie": [],
                        "responseTime": 953,
                        "responseSize": 571
                      },
                      "id": "0328946d-6184-48ee-86d0-8ac91bfd46c7",
                      "assertions": [
                        {
                          "assertion": "response is ok",
                          "skipped": false
                        },
                        {
                          "assertion": "response body has json with request queries",
                          "skipped": false
                        }
                      ]
                    },
                    {
                      "cursor": {
                        "ref": "e0c61ca3-8330-4688-816a-b8fdce5f0348",
                        "length": 2,
                        "cycles": 2,
                        "position": 1,
                        "iteration": 0,
                        "httpRequestId": "186dac2b-759e-438d-b2d1-f5453e139652"
                      },
                      "item": {
                        "id": "52fe8b79-d323-4303-91e6-b3ed9a5e41bd",
                        "name": "Expired SSL Request",
                        "request": {
                          "url": {
                            "protocol": "https",
                            "path": [
                              ""
                            ],
                            "host": [
                              "expired",
                              "badssl",
                              "com"
                            ],
                            "query": [],
                            "variable": []
                          },
                          "method": "GET"
                        },
                        "response": [],
                        "event": [
                          {
                            "listen": "test",
                            "script": {
                              "id": "871b5383-4a2a-4c8b-9a18-3640e298bb34",
                              "type": "text/javascript",
                              "exec": [
                                "pm.test(\"Status code is 200\", function () {",
                                "    pm.response.to.have.status(200);",
                                "});"
                              ],
                              "_lastExecutionId": "7cdb8f27-fcc2-4ab9-87c5-416c50202cc2"
                            }
                          }
                        ]
                      },
                      "request": {
                        "url": {
                          "protocol": "https",
                          "path": [
                            ""
                          ],
                          "host": [
                            "expired",
                            "badssl",
                            "com"
                          ],
                          "query": [],
                          "variable": []
                        },
                        "header": [
                          {
                            "key": "User-Agent",
                            "value": "PostmanRuntime/7.28.4",
                            "system": true
                          },
                          {
                            "key": "Accept",
                            "value": "*/*",
                            "system": true
                          },
                          {
                            "key": "Cache-Control",
                            "value": "no-cache",
                            "system": true
                          },
                          {
                            "key": "Postman-Token",
                            "value": "cf2438d6-f0ff-499b-abdb-ec412968793f",
                            "system": true
                          },
                          {
                            "key": "Host",
                            "value": "expired.badssl.com",
                            "system": true
                          },
                          {
                            "key": "Accept-Encoding",
                            "value": "gzip, deflate, br",
                            "system": true
                          },
                          {
                            "key": "Connection",
                            "value": "keep-alive",
                            "system": true
                          }
                        ],
                        "method": "GET"
                      },
                      "id": "52fe8b79-d323-4303-91e6-b3ed9a5e41bd",
                      "requestError": {
                        "code": "CERT_HAS_EXPIRED"
                      },
                      "assertions": [
                        {
                          "assertion": "Status code is 200",
                          "skipped": false,
                          "error": {
                            "name": "AssertionError",
                            "index": 0,
                            "test": "Status code is 200",
                            "message": "expected { Object (id, _details, ...) } to have property 'code'",
                            "stack": "AssertionError: expected { Object (id, _details, ...) } to have property 'code'\n   at Object.eval sandbox-script.js:1:2)"
                          }
                        }
                      ]
                    },
                    {
                      "cursor": {
                        "ref": "9575f7c0-6afa-41da-beca-435a1de71d56",
                        "length": 2,
                        "cycles": 2,
                        "position": 0,
                        "iteration": 1,
                        "cr": true,
                        "httpRequestId": "310f7d30-684a-4f60-8e83-b32c9dbee520"
                      },
                      "item": {
                        "id": "0328946d-6184-48ee-86d0-8ac91bfd46c7",
                        "name": "postman-echo Request",
                        "request": {
                          "url": {
                            "protocol": "https",
                            "path": [
                              "post"
                            ],
                            "host": [
                              "{{base-url}}"
                            ],
                            "query": [
                              {
                                "key": "foo1",
                                "value": "bar1"
                              },
                              {
                                "key": "foo2",
                                "value": "bar2"
                              }
                            ],
                            "variable": []
                          },
                          "method": "POST",
                          "body": {
                            "mode": "raw",
                            "raw": "{\n        \"foo1\": \"bar1\",\n        \"foo2\": \"bar2\"\n    }",
                            "options": {
                              "raw": {
                                "language": "json"
                              }
                            }
                          }
                        },
                        "response": [],
                        "event": [
                          {
                            "listen": "test",
                            "script": {
                              "id": "ae1cdcc5-c150-4744-b067-2a3fe6cd90a4",
                              "type": "text/javascript",
                              "exec": [
                                "pm.test(\"response is ok\", function () {",
                                "    pm.response.to.have.status(200);",
                                "});",
                                "",
                                "pm.test(\"response body has json with request queries\", function () {",
                                "    pm.response.to.have.jsonBody('args.foo1', 'bar1')",
                                "        .and.have.jsonBody('args.foo2', 'bar2');",
                                "    ",
                                "    pm.response.to.have.jsonBody('data.foo1', 'bar1')",
                                "        .and.have.jsonBody('data.foo2', 'bar2');",
                                "});"
                              ],
                              "_lastExecutionId": "030d6832-2c7e-455b-8f2e-1761f2435b98"
                            }
                          }
                        ]
                      },
                      "request": {
                        "url": {
                          "protocol": "https",
                          "path": [
                            "post"
                          ],
                          "host": [
                            "postman-echo",
                            "com"
                          ],
                          "query": [
                            {
                              "key": "foo1",
                              "value": "bar1"
                            },
                            {
                              "key": "foo2",
                              "value": "bar2"
                            }
                          ],
                          "variable": []
                        },
                        "header": [
                          {
                            "key": "Content-Type",
                            "value": "application/json",
                            "system": true
                          },
                          {
                            "key": "User-Agent",
                            "value": "PostmanRuntime/7.28.4",
                            "system": true
                          },
                          {
                            "key": "Accept",
                            "value": "*/*",
                            "system": true
                          },
                          {
                            "key": "Cache-Control",
                            "value": "no-cache",
                            "system": true
                          },
                          {
                            "key": "Postman-Token",
                            "value": "b7d7421d-5c2b-4cc5-b7c4-d6bb80ff384b",
                            "system": true
                          },
                          {
                            "key": "Host",
                            "value": "postman-echo.com",
                            "system": true
                          },
                          {
                            "key": "Accept-Encoding",
                            "value": "gzip, deflate, br",
                            "system": true
                          },
                          {
                            "key": "Connection",
                            "value": "keep-alive",
                            "system": true
                          },
                          {
                            "key": "Content-Length",
                            "value": "54",
                            "system": true
                          },
                          {
                            "key": "Cookie",
                            "value": "sails.sid=s%3AXohwDMNej6EuzZ3MGUMeS3bfQ4fm8mgV.Uhhexk51B7vd5FGKwpA1L05FHL%2BZl%2FnnstEp3qCxQ4Y",
                            "system": true
                          }
                        ],
                        "method": "POST",
                        "body": {
                          "mode": "raw",
                          "raw": "{\n        \"foo1\": \"bar1\",\n        \"foo2\": \"bar2\"\n    }",
                          "options": {
                            "raw": {
                              "language": "json"
                            }
                          }
                        }
                      },
                      "response": {
                        "id": "235ce364-a85e-4cd3-aab3-731f6a946a56",
                        "status": "OK",
                        "code": 200,
                        "header": [
                          {
                            "key": "Date",
                            "value": "Wed, 06 Oct 2021 08:56:52 GMT"
                          },
                          {
                            "key": "Content-Type",
                            "value": "application/json; charset=utf-8"
                          },
                          {
                            "key": "Content-Length",
                            "value": "677"
                          },
                          {
                            "key": "Connection",
                            "value": "keep-alive"
                          },
                          {
                            "key": "ETag",
                            "value": "W/\"2a5-2fX4k8arQmDTeyWnWhT4qO0uvz8\""
                          },
                          {
                            "key": "Vary",
                            "value": "Accept-Encoding"
                          }
                        ],
                        "stream": {
                          "type": "Buffer",
                          "data": [
                            123, 34, 97, 114, 103, 115, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125, 44, 34, 100, 97, 116, 97, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125, 44, 34, 102, 105, 108, 101, 115, 34, 58, 123, 125, 44, 34, 102, 111, 114, 109, 34, 58, 123, 125, 44, 34, 104, 101, 97, 100, 101, 114, 115, 34, 58, 123, 34, 120, 45, 102, 111, 114, 119, 97, 114, 100, 101, 100, 45, 112, 114, 111, 116, 111, 34, 58, 34, 104, 116, 116, 112, 115, 34, 44, 34, 120, 45, 102, 111, 114, 119, 97, 114, 100, 101, 100, 45, 112, 111, 114, 116, 34, 58, 34, 52, 52, 51, 34, 44, 34, 104, 111, 115, 116, 34, 58, 34, 112, 111, 115, 116, 109, 97, 110, 45, 101, 99, 104, 111, 46, 99, 111, 109, 34, 44, 34, 120, 45, 97, 109, 122, 110, 45, 116, 114, 97, 99, 101, 45, 105, 100, 34, 58, 34, 82, 111, 111, 116, 61, 49, 45, 54, 49, 53, 100, 54, 52, 100, 52, 45, 55, 99, 54, 97, 52, 53, 54, 102, 50, 50, 57, 53, 50, 51, 98, 52, 50, 49, 55, 101, 51, 97, 48, 51, 34, 44, 34, 99, 111, 110, 116, 101, 110, 116, 45, 108, 101, 110, 103, 116, 104, 34, 58, 34, 53, 52, 34, 44, 34, 99, 111, 110, 116, 101, 110, 116, 45, 116, 121, 112, 101, 34, 58, 34, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 34, 44, 34, 117, 115, 101, 114, 45, 97, 103, 101, 110, 116, 34, 58, 34, 80, 111, 115, 116, 109, 97, 110, 82, 117, 110, 116, 105, 109, 101, 47, 55, 46, 50, 56, 46, 52, 34, 44, 34, 97, 99, 99, 101, 112, 116, 34, 58, 34, 42, 47, 42, 34, 44, 34, 99, 97, 99, 104, 101, 45, 99, 111, 110, 116, 114, 111, 108, 34, 58, 34, 110, 111, 45, 99, 97, 99, 104, 101, 34, 44, 34, 112, 111, 115, 116, 109, 97, 110, 45, 116, 111, 107, 101, 110, 34, 58, 34, 98, 55, 100, 55, 52, 50, 49, 100, 45, 53, 99, 50, 98, 45, 52, 99, 99, 53, 45, 98, 55, 99, 52, 45, 100, 54, 98, 98, 56, 48, 102, 102, 51, 56, 52, 98, 34, 44, 34, 97, 99, 99, 101, 112, 116, 45, 101, 110, 99, 111, 100, 105, 110, 103, 34, 58, 34, 103, 122, 105, 112, 44, 32, 100, 101, 102, 108, 97, 116, 101, 44, 32, 98, 114, 34, 44, 34, 99, 111, 111, 107, 105, 101, 34, 58, 34, 115, 97, 105, 108, 115, 46, 115, 105, 100, 61, 115, 37, 51, 65, 88, 111, 104, 119, 68, 77, 78, 101, 106, 54, 69, 117, 122, 90, 51, 77, 71, 85, 77, 101, 83, 51, 98, 102, 81, 52, 102, 109, 56, 109, 103, 86, 46, 85, 104, 104, 101, 120, 107, 53, 49, 66, 55, 118, 100, 53, 70, 71, 75, 119, 112, 65, 49, 76, 48, 53, 70, 72, 76, 37, 50, 66, 90, 108, 37, 50, 70, 110, 110, 115, 116, 69, 112, 51, 113, 67, 120, 81, 52, 89, 34, 125, 44, 34, 106, 115, 111, 110, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125, 44, 34, 117, 114, 108, 34, 58, 34, 104, 116, 116, 112, 115, 58, 47, 47, 112, 111, 115, 116, 109, 97, 110, 45, 101, 99, 104, 111, 46, 99, 111, 109, 47, 112, 111, 115, 116, 63, 102, 111, 111, 49, 61, 98, 97, 114, 49, 38, 102, 111, 111, 50, 61, 98, 97, 114, 50, 34, 125
                          ]
                        },
                        "cookie": [],
                        "responseTime": 222,
                        "responseSize": 677
                      },
                      "id": "0328946d-6184-48ee-86d0-8ac91bfd46c7",
                      "assertions": [
                        {
                          "assertion": "response is ok",
                          "skipped": false
                        },
                        {
                          "assertion": "response body has json with request queries",
                          "skipped": false
                        }
                      ]
                    },
                    {
                      "cursor": {
                        "ref": "afeb533e-4ef1-4f66-b3ea-152fad83a059",
                        "length": 2,
                        "cycles": 2,
                        "position": 1,
                        "iteration": 1,
                        "httpRequestId": "d83212b0-7fad-487a-80e6-cfd71e12e880"
                      },
                      "item": {
                        "id": "52fe8b79-d323-4303-91e6-b3ed9a5e41bd",
                        "name": "Expired SSL Request",
                        "request": {
                          "url": {
                            "protocol": "https",
                            "path": [
                              ""
                            ],
                            "host": [
                              "expired",
                              "badssl",
                              "com"
                            ],
                            "query": [],
                            "variable": []
                          },
                          "method": "GET"
                        },
                        "response": [],
                        "event": [
                          {
                            "listen": "test",
                            "script": {
                              "id": "871b5383-4a2a-4c8b-9a18-3640e298bb34",
                              "type": "text/javascript",
                              "exec": [
                                "pm.test(\"Status code is 200\", function () {",
                                "    pm.response.to.have.status(200);",
                                "});"
                              ],
                              "_lastExecutionId": "7cdb8f27-fcc2-4ab9-87c5-416c50202cc2"
                            }
                          }
                        ]
                      },
                      "request": {
                        "url": {
                          "protocol": "https",
                          "path": [
                            ""
                          ],
                          "host": [
                            "expired",
                            "badssl",
                            "com"
                          ],
                          "query": [],
                          "variable": []
                        },
                        "header": [
                          {
                            "key": "User-Agent",
                            "value": "PostmanRuntime/7.28.4",
                            "system": true
                          },
                          {
                            "key": "Accept",
                            "value": "*/*",
                            "system": true
                          },
                          {
                            "key": "Cache-Control",
                            "value": "no-cache",
                            "system": true
                          },
                          {
                            "key": "Postman-Token",
                            "value": "fc275df0-b78a-43f2-9e88-2ebf0c37362d",
                            "system": true
                          },
                          {
                            "key": "Host",
                            "value": "expired.badssl.com",
                            "system": true
                          },
                          {
                            "key": "Accept-Encoding",
                            "value": "gzip, deflate, br",
                            "system": true
                          },
                          {
                            "key": "Connection",
                            "value": "keep-alive",
                            "system": true
                          }
                        ],
                        "method": "GET"
                      },
                      "id": "52fe8b79-d323-4303-91e6-b3ed9a5e41bd",
                      "requestError": {
                        "code": "CERT_HAS_EXPIRED"
                      },
                      "assertions": [
                        {
                          "assertion": "Status code is 200",
                          "skipped": false,
                          "error": {
                            "name": "AssertionError",
                            "index": 0,
                            "test": "Status code is 200",
                            "message": "expected { Object (id, _details, ...) } to have property 'code'",
                            "stack": "AssertionError: expected { Object (id, _details, ...) } to have property 'code'\n   at Object.eval sandbox-script.js:1:2)"
                          }
                        }
                      ]
                    }
                  ];
                this.badSSLRequestIdx = 1;
                this.iterationCount = 2;
                this.skipResponse = false;
            })


            it('creates empty iterations when executions is empty', function(){
                const executions = [],

                iterations = _executionToIterationConverter(executions, this.iterationCount, this.skipResponse);
                expect(iterations).to.be.an('array', );
                expect(iterations.length).to.equal(0, 'Executions array of length 0 should always create a iterations array of length 0 irrespective of other params');

            });

            it('Each iterations array element should have all the properties', function(){

                const iterations = _executionToIterationConverter(this.executions, this.iterationCount, this.skipResponse);

                expect(iterations.length).to.be.equal(this.iterationCount,'Iterations array doesn\'t have the correct length');

                iterations.forEach(iters => {
                    iters.forEach(req => {
                        expect(req).that.includes.all.keys(['id', 'name', 'request', 'response', 'error', 'tests']);
                        expect(req.id).to.be.a('string');
                        expect(req.name).to.not.equal('');
                        expect(req.request).to.be.an('object');
                        expect(req.tests).to.be.an('array');
                    });
                });

            });

            it('adds request error when the we are unable to make request - badssl.com', function(){
                const iterations = _executionToIterationConverter(this.executions, this.iterationCount, this.skipResponse);

                iterations.forEach(iter => {
                    expect(iter[this.badSSLRequestIdx].response).to.be.null;
                    expect(iter[this.badSSLRequestIdx].error).to.be.an('object');
                });

            });

        });

        describe('_buildRequestObject', function(){

            before(function(){
                this.executionsReq = {
                    "url": {
                      "protocol": "https",
                      "path": [
                        "post"
                      ],
                      "host": [
                        "postman-echo",
                        "com"
                      ],
                      "query": [
                        {
                          "key": "foo1",
                          "value": "bar1"
                        },
                        {
                          "key": "foo2",
                          "value": "bar2"
                        }
                      ],
                      "variable": []
                    },
                    "header": [
                      {
                        "key": "Content-Type",
                        "value": "application/json",
                        "system": true
                      },
                      {
                        "key": "User-Agent",
                        "value": "PostmanRuntime/7.28.4",
                        "system": true
                      },
                      {
                        "key": "Accept",
                        "value": "*/*",
                        "system": true
                      },
                      {
                        "key": "Cache-Control",
                        "value": "no-cache",
                        "system": true
                      },
                      {
                        "key": "Postman-Token",
                        "value": "2a797f93-eeda-4db2-be45-df925178a288",
                        "system": true
                      },
                      {
                        "key": "Host",
                        "value": "postman-echo.com",
                        "system": true
                      },
                      {
                        "key": "Accept-Encoding",
                        "value": "gzip, deflate, br",
                        "system": true
                      },
                      {
                        "key": "Connection",
                        "value": "keep-alive",
                        "system": true
                      },
                      {
                        "key": "Content-Length",
                        "value": "54",
                        "system": true
                      }
                    ],
                    "method": "POST",
                    "body": {
                      "mode": "raw",
                      "raw": "{\n        \"foo1\": \"bar1\",\n        \"foo2\": \"bar2\"\n    }",
                      "options": {
                        "raw": {
                          "language": "json"
                        }
                      }
                    }
                  }
            })

            it('should return an empty object when called with an empty request object', function(){
                expect(_buildRequestObject()).to.deep.equal({});
            });

            it('builds the request object with correct properties', function(){

                const request = _buildRequestObject(this.executionsReq);

                expect(request).that.includes.all.keys(['url', 'method', 'headers', 'body', 'path']);

                expect(request.url).to.be.equal('https://postman-echo.com/post?foo1=bar1&foo2=bar2');
                expect(request.method).to.be.equal('POST')
                expect(request.headers).to.deep.equal({
                    'Content-Type': 'application/json',
                    'User-Agent': 'PostmanRuntime/7.28.4',
                    Accept: '*/*',
                    'Cache-Control': 'no-cache',
                    'Postman-Token': '2a797f93-eeda-4db2-be45-df925178a288',
                    Host: 'postman-echo.com',
                    'Accept-Encoding': 'gzip, deflate, br',
                    Connection: 'keep-alive',
                    'Content-Length': '54'
                  });

                expect(request.body).to.deep.equal({
                        mode: 'raw',
                        raw: '{\n        "foo1": "bar1",\n        "foo2": "bar2"\n    }',
                        options: { raw: { language: 'json' } }
                      }
                );
            });

        });

        describe('_buildResponseObject', function(){

            before(function(){
                 this.executionResponse =  {
                    "id": "08b52379-9d76-4bac-8dc0-d1f5cfa90143",
                    "status": "OK",
                    "code": 200,
                    "header": [
                      {
                        "key": "Date",
                        "value": "Wed, 06 Oct 2021 07:57:14 GMT"
                      },
                      {
                        "key": "Content-Type",
                        "value": "application/json; charset=utf-8"
                      },
                      {
                        "key": "Content-Length",
                        "value": "419"
                      },
                      {
                        "key": "Connection",
                        "value": "keep-alive"
                      },
                      {
                        "key": "ETag",
                        "value": "W/\"1a3-t0HNOpytniK+eD28PdunyhI6aFM\""
                      },
                      {
                        "key": "Vary",
                        "value": "Accept-Encoding"
                      },
                      {
                        "key": "set-cookie",
                        "value": "sails.sid=s%3Am0oVGjOznEYWenwBlnBj6IJK0WmS1R6-.PhXp6Osbx5gsr6QsNfj6r61VKfg9Wf1t1YGdyPkieVs; Path=/; HttpOnly"
                      }
                    ],
                    "stream": {
                      "type": "Buffer",
                      "data": [
                        123, 34, 97, 114, 103, 115, 34, 58, 123, 34, 102, 111, 111, 49, 34, 58, 34, 98, 97, 114, 49, 34, 44, 34, 102, 111, 111, 50, 34, 58, 34, 98, 97, 114, 50, 34, 125,
                        44, 34, 104, 101, 97, 100, 101, 114, 115, 34, 58, 123, 34, 120, 45, 102, 111, 114, 119, 97, 114, 100, 101, 100, 45, 112, 114, 111, 116, 111, 34, 58, 34, 104, 116,
                        116, 112, 115, 34, 44, 34, 120, 45, 102, 111, 114, 119, 97, 114, 100, 101, 100, 45, 112, 111, 114, 116, 34, 58, 34, 52, 52, 51, 34, 44, 34, 104, 111, 115, 116, 34,
                        58, 34, 112, 111, 115, 116, 109, 97, 110, 45, 101, 99, 104, 111, 46, 99, 111, 109, 34, 44, 34, 120, 45, 97, 109, 122, 110, 45, 116, 114, 97, 99, 101, 45, 105, 100,
                        34, 58, 34, 82, 111, 111, 116, 61, 49, 45, 54, 49, 53, 100, 53, 54, 100, 97, 45, 52, 98, 49, 50, 52, 101, 54, 97, 48, 97, 57, 54, 53, 54, 99, 98, 55, 48, 99, 55, 48,
                        57, 101, 52, 34, 44, 34, 117, 115, 101, 114, 45, 97, 103, 101, 110, 116, 34, 58, 34, 80, 111, 115, 116, 109, 97, 110, 82, 117, 110, 116, 105, 109, 101, 47, 55, 46, 50,
                        56, 46, 52, 34, 44, 34, 97, 99, 99, 101, 112, 116, 34, 58, 34, 42, 47, 42, 34, 44, 34, 99, 97, 99, 104, 101, 45, 99, 111, 110, 116, 114, 111, 108, 34, 58, 34, 110, 111,
                        45, 99, 97, 99, 104, 101, 34, 44, 34, 112, 111, 115, 116, 109, 97, 110, 45, 116, 111, 107, 101, 110, 34, 58, 34, 102, 52, 99, 97, 48, 98, 100, 101, 45, 49, 52, 48, 99,
                        45, 52, 102, 52, 101, 45, 57, 49, 101, 55, 45, 51, 99, 99, 53, 49, 99, 49, 97, 100, 52, 56, 97, 34, 44, 34, 97, 99, 99, 101, 112, 116, 45, 101, 110, 99, 111, 100, 105, 110,
                        103, 34, 58, 34, 103, 122, 105, 112, 44, 32, 100, 101, 102, 108, 97, 116, 101, 44, 32, 98, 114, 34, 125, 44, 34, 117, 114, 108, 34, 58, 34, 104, 116, 116, 112, 115, 58, 47,
                        47, 112, 111, 115, 116, 109, 97, 110, 45, 101, 99, 104, 111, 46, 99, 111, 109, 47, 103, 101, 116, 63, 102, 111, 111, 49, 61, 98, 97, 114, 49, 38, 102, 111, 111, 50, 61, 98,
                        97, 114, 50, 34, 125
                      ]
                    },
                    "cookie": [],
                    "responseTime": 933,
                    "responseSize": 419
                  }
            })

            it('should return an empty object when called with an empty response object', function(){
                expect(_buildResponseObject()).to.deep.equal({});
            });

            it('builds the object with correct properties', function(){
                const skipResponse = false;
                const response = _buildResponseObject(this.executionResponse, skipResponse);

                expect(response).that.includes.all.keys(['code', 'name', 'time', 'size', 'headers', 'body']);

                expect(response.code).to.equal(200);
                expect(response.name).to.equal('OK');
                expect(response.headers).to.deep.equals([
                    {
                      "key": "Date",
                      "value": "Wed, 06 Oct 2021 07:57:14 GMT"
                    },
                    {
                      "key": "Content-Type",
                      "value": "application/json; charset=utf-8"
                    },
                    {
                      "key": "Content-Length",
                      "value": "419"
                    },
                    {
                      "key": "Connection",
                      "value": "keep-alive"
                    },
                    {
                      "key": "ETag",
                      "value": "W/\"1a3-t0HNOpytniK+eD28PdunyhI6aFM\""
                    },
                    {
                      "key": "Vary",
                      "value": "Accept-Encoding"
                    },
                    {
                      "key": "set-cookie",
                      "value": "sails.sid=s%3Am0oVGjOznEYWenwBlnBj6IJK0WmS1R6-.PhXp6Osbx5gsr6QsNfj6r61VKfg9Wf1t1YGdyPkieVs; Path=/; HttpOnly"
                    }
                  ]);
                expect(response.body).to.be.equal('{"args":{"foo1":"bar1","foo2":"bar2"},"headers":{"x-forwarded-proto":"https","x-forwarded-port":"443","host":"postman-echo.com","x-amzn-trace-id":"Root=1-615d56da-4b124e6a0a9656cb70c709e4","user-agent":"PostmanRuntime/7.28.4","accept":"*/*","cache-control":"no-cache","postman-token":"f4ca0bde-140c-4f4e-91e7-3cc51c1ad48a","accept-encoding":"gzip, deflate, br"},"url":"https://postman-echo.com/get?foo1=bar1&foo2=bar2"}');

            });

            it('doesn\'t append body to response if skipResponse is true', function(){
                const skipResponse = true;
                const response = _buildResponseObject(this.executionResponse, skipResponse);
                expect(response).that.includes.all.keys(['code', 'name', 'time', 'size', 'headers', 'body']);

                expect(response.body).is.be.null;
            });

        });

        describe('_buildTestObject', function(){
            before(function(){
                this.executionAssertion = [
                    {
                        assertion: 'response is ok',
                        skipped: false
                    },{
                        assertion: 'response body has json with request queries',
                        skipped: false
                    },{
                        assertion: 'Status code is 200',
                        skipped: false,
                        error: {
                            name: 'AssertionError',
                            index: 0,
                            test: 'Status code is 200',
                            message: `expected { Object (id, _details, ...) } to have property 'code'`,
                            stack: `AssertionError: expected { Object (id, _details, ...) } to have property 'code'\n   at Object.eval sandbox-script.js:1:2)`
                        }
                    }
                ]
            });

            it('creates an empty tests array when assertions array is not present', function(){
                expect(_buildTestObject()).to.be.a('array');
                expect(_buildTestObject()).to.deep.equal([]);
            });

            it('should create test array which has the same length as the assertions array passed to it', function(){
                const testObj =_buildTestObject(this.executionAssertion);
                expect(testObj.length).to.be.equal(this.executionAssertion.length);
            });

            it('should create a test array of Object where each element has name, error, status properties', function(){
                const testObj =_buildTestObject(this.executionAssertion);
                const failedTestIdx = 2;

                testObj.forEach((test, idx) => {
                    expect(test).that.includes.all.keys(['name', 'error', 'status']);
                    expect(test.name).to.be.equal(this.executionAssertion[idx].assertion);
                    if(idx === failedTestIdx){
                        expect(test.status).to.be.equal('fail');
                        expect(test.error).to.deep.equal({
                            name: 'AssertionError',
                            message: `expected { Object (id, _details, ...) } to have property 'code'`,
                            stack: `AssertionError: expected { Object (id, _details, ...) } to have property 'code'\n   at Object.eval sandbox-script.js:1:2)`
                        });
                    }else{
                        expect(test.error).to.be.null;
                        expect(test.status).to.be.equal('pass');
                    }
                });

            });
        });

    });
});
