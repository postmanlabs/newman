var nock = require('nock'),

    // this options set true, allows request with unmatched nock to go to the server
    ALLOW_UNMOCKED = { allowUnmocked: true },
    TURN_OFF_NOCK = false;

function mockGETrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .defaultReplyHeaders({
            'Content-Type': 'application/json; charset=utf-8'
        })
        .get('/get')
        .query(true)
        .reply(200, function (uri) {
            var reply = {
                    args: {},
                    headers: this.req.headers,
                    url: uri
                },
                query = this.req.path.substring(5).split('&'),
                temp,
                arr;

            reply.url = 'https://' + reply.headers.host + uri;
            reply.headers['x-forwarded-port'] = '443';
            reply.headers['x-forwarded-proto'] = 'https';

            // create args
            query.forEach((element) => {
                temp = element.split('=');

                if (element.includes('%7B%7B')) { // varible without value replacement, ie {{..}}
                    temp[1] = '{{' + temp[1].substring(6, temp[1].length - 6) + '}}';
                }
                if (reply.args[temp[0]] === undefined) { // yet to be assigned
                    reply.args[temp[0]] = temp[1];
                }
                else if (typeof reply.args[temp[0]] === 'string' || reply.args[temp[0]] instanceof String) {
                    // args key that already has one value
                    arr = [];

                    arr[0] = reply.args[temp[0]]; // add current value
                    arr.push(temp[1]); // add new value
                    reply.args[temp[0]] = arr; // assign the value array to a key
                }
                else { // already is an array
                    reply.args[temp[0]].push(temp[1]);
                }
            });

            return reply;
        });
}

function mockPOSTrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .defaultReplyHeaders({
            'Content-Type': 'application/json; charset=utf-8'
        })
        .post('/post')
        .query(true)
        .reply(function (uri, requestBody) {
            var reply = {
                    headers: this.req.headers,
                    args: {},
                    data: {},
                    form: {},
                    files: {}
                },
                i,
                fileNames,
                query,
                tokens,
                temp,
                key,
                params;

            if (reply.headers['content-type'] === 'text/plain') {
                reply.data = requestBody;

                return [200, reply, { 'Content-Type': 'application/json; charset=utf-8' }];
            }

            // create args from uri
            if (uri.includes('?')) { // path has params
                params = uri.substring(6).split('&');
                params.forEach((element) => {
                    temp = element.split('=');

                    if (temp[1].includes('%5C')) { // value has escaped character(s), ie '\'
                        tokens = temp[1].split('%');
                        temp[1] = tokens[0];
                        for (i = 1; i < tokens.length; i++) {
                            temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                        }
                    }
                    if (element.includes('%7B%7B')) { // varible without value {{..}}
                        reply.args[temp[0]] = '{{' + temp[1].substring(6, temp[1].length - 6) + '}}';
                    }
                    else if (reply.args[temp[0]] === undefined) { // yet to be assigned
                        reply.args[temp[0]] = temp[1];
                    }
                    else if (typeof reply.args[temp[0]] === 'string' || reply.args[temp[0]] instanceof String) {
                        // already has one value
                        var arr = [];

                        arr[0] = reply.args[temp[0]];
                        arr.push(temp[1]);
                        reply.args[temp[0]] = arr;
                    }
                    else { // already is an array
                        reply.args[temp[0]].push(temp[1]);
                    }
                });
            }

            // create form from requestBody
            if (typeof requestBody === 'string' || requestBody instanceof String) {
                if (!requestBody.includes(' ')) { // x-www-urlencoded
                    query = requestBody.split('&');
                    query.forEach((element) => {
                        temp = element.split('=');
                        if (temp[1] && temp[1].includes('%5C')) {
                            tokens = temp[1].split('%');
                            temp[1] = tokens[0];
                            for (i = 1; i < tokens.length; i++) {
                                temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                            }
                        }
                        reply.form[temp[0]] = temp[1];
                    });
                }
                // form-data
                else if (!requestBody.includes('filename=')) { // usual key-value pairs
                    query = requestBody.split('\n');
                    for (i = 0; query[i + 1]; i += 4) {
                        key = (query[i + 1].split('='))[1];
                        key = key.substring(1, key.length - 2);
                        reply.form[key] = query[i + 3].substring(0, query[i + 3].length - 1);
                    }
                }
                else if (requestBody.includes('filename=')) { // contains files
                    fileNames = [];
                    tokens = requestBody.split('filename="');
                    for (i = 1; i < tokens.length; i++) {
                        fileNames[i - 1] = tokens[i].split('"')[0];
                        reply.files[fileNames[i - 1]] = 'data:application/octet-stream;base64,';
                    }
                }
            }
            else if (typeof requestBody === 'object') {
                reply.json = requestBody;
            }

            return [200, reply, { 'Content-Type': 'application/json; charset=utf-8' }];
        });
}

function mockPUTrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .put('/put')
        .query(true)
        .reply(200, function (uri, requestBody) {
            var reply = {
                    headers: this.req.headers,
                    args: {},
                    data: {},
                    form: {},
                    files: {},
                    url: this.req.path
                },
                i,
                fileNames,
                query,
                tokens,
                temp,
                key,
                params;

            if (reply.headers['content-type'] === 'text/plain') {
                reply.data = requestBody;

                return reply;
            }

            // create args from uri
            if (uri.includes('?')) { // path has params
                params = uri.substring(6).split('&');
                params.forEach((element) => {
                    temp = element.split('=');

                    if (temp[1].includes('%5C')) { // value has escaped '\'
                        tokens = temp[1].split('%');
                        temp[1] = tokens[0];
                        for (i = 1; i < tokens.length; i++) {
                            temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                        }
                    }
                    if (element.includes('%7B%7B')) { // varible without value {{..}}
                        temp[1] = '{{' + temp[1].substring(6, temp[1].length - 6) + '}}';
                    }
                    if (reply.args[temp[0]] === undefined) { // yet to be assigned
                        reply.args[temp[0]] = temp[1];
                    }
                    else if (typeof reply.args[temp[0]] === 'string' || reply.args[temp[0]] instanceof String) {
                        // the args key already has one value
                        var arr = [];

                        arr[0] = reply.args[temp[0]];
                        arr.push(temp[1]);
                        reply.args[temp[0]] = arr;
                    }
                    else { // already is an array
                        reply.args[temp[0]].push(temp[1]);
                    }
                });
            }

            // create form from requestBody
            if (typeof requestBody === 'string' || requestBody instanceof String) {
                if (!requestBody.includes(' ')) { // x-www-urlencoded
                    query = requestBody.split('&');

                    query.forEach((element) => {
                        temp = element.split('=');
                        if (temp[1] && temp[1].includes('%5C')) { // escaped characters
                            tokens = temp[1].split('%');
                            temp[1] = tokens[0];
                            for (i = 1; i < tokens.length; i++) {
                                temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                            }
                        }
                        reply.form[temp[0]] = temp[1];
                    });
                }
                // form-data
                else if (!requestBody.includes('filename=')) { // usual key-value pairs
                    query = requestBody.split('\n');
                    for (i = 0; query[i + 1]; i += 4) {
                        key = (query[i + 1].split('='))[1];
                        key = key.substring(1, key.length - 2);
                        reply.form[key] = query[i + 3].substring(0, query[i + 3].length - 1);
                    }
                }
                else if (requestBody.includes('filename=')) { // contains files
                    fileNames = [];
                    tokens = requestBody.split('filename="');
                    for (i = 1; i < tokens.length; i++) {
                        fileNames[i - 1] = tokens[i].split('"')[0];
                        reply.files[fileNames[i - 1]] = 'data:application/octet-stream;base64,';
                    }
                }
            }
            else if (typeof requestBody === 'object') {
                reply.json = requestBody;
            }

            return reply;
        }, { 'Content-Type': 'application/json; charset=uyf-8' });
}

function mockPATCHrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .defaultReplyHeaders({
            'Content-Type': 'application/json; charset=utf-8'
        })
        .patch('/patch')
        .query(true)
        .reply(200, function (uri, requestBody) {
            var reply = {
                    headers: this.req.headers,
                    args: {},
                    data: {},
                    form: {},
                    files: {},
                    url: this.req.path
                },
                i,
                fileNames,
                query,
                tokens,
                temp,
                key,
                params;

            reply.url = 'https://' + reply.headers.host + uri;

            if (reply.headers['content-type'] === 'text/plain') {
                reply.data = requestBody;

                return reply;
            }

            // create args from uri
            if (uri.includes('?')) { // path has params
                params = uri.substring(6).split('&');

                params.forEach((element) => {
                    temp = element.split('=');

                    if (temp[1].includes('%5C')) { // value has escaped '\'
                        tokens = temp[1].split('%');


                        temp[1] = tokens[0];
                        for (i = 1; i < tokens.length; i++) {
                            temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                        }
                    }
                    if (element.includes('%7B%7B')) { // varible without value {{..}}
                        temp[1] = '{{' + temp[1].substring(6, temp[1].length - 6) + '}}';
                    }
                    if (reply.args[temp[0]] === undefined) { // yet to be assigned
                        reply.args[temp[0]] = temp[1];
                    }
                    else if (typeof reply.args[temp[0]] === 'string' || reply.args[temp[0]] instanceof String) {
                        // already has one value
                        var arr = [];

                        arr[0] = reply.args[temp[0]];
                        arr.push(temp[1]);
                        reply.args[temp[0]] = arr;
                    }
                    else { // already is an array
                        reply.args[temp[0]].push(temp[1]);
                    }
                });
            }

            // create form from requestBody
            if (typeof requestBody === 'string' || requestBody instanceof String) {
                if (!requestBody.includes(' ')) { // x-www-urlencoded
                    query = requestBody.split('&');
                    query.forEach((element) => {
                        temp = element.split('=');
                        if (temp[1] && temp[1].includes('%5C')) {
                            tokens = temp[1].split('%');
                            temp[1] = tokens[0];
                            for (i = 1; i < tokens.length; i++) {
                                temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                            }
                        }
                        reply.form[temp[0]] = temp[1];
                    });
                }
                // form-data
                else if (!requestBody.includes('filename=')) { // usual key-value pairs
                    query = requestBody.split('\n');
                    for (i = 0; query[i + 1]; i += 4) {
                        key = (query[i + 1].split('='))[1];
                        key = key.substring(1, key.length - 2);
                        reply.form[key] = query[i + 3].substring(0, query[i + 3].length - 1);
                    }
                }
                else if (requestBody.includes('filename=')) { // form contains files
                    fileNames = [];
                    tokens = requestBody.split('filename="');
                    for (i = 1; i < tokens.length; i++) {
                        fileNames[i - 1] = tokens[i].split('"')[0];
                        reply.files[fileNames[i - 1]] = 'data:application/octet-stream;base64,';
                    }
                }
            }
            else if (typeof requestBody === 'object') {
                reply.json = requestBody;
            }

            return reply;
        });
}

function mockDELETErequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .defaultReplyHeaders({
            'Content-Type': 'application/json; charset=utf-8'
        })
        .delete('/delete')
        .query(true)
        .reply(200, function (uri, requestBody) {
            var reply = {
                    headers: this.req.headers,
                    args: {},
                    data: {},
                    form: {},
                    files: {},
                    url: this.req.path
                },
                i,
                temp,
                params,
                query,
                tokens,
                key,
                fileNames;

            reply.url = 'https://' + reply.headers.host + uri;

            if (reply.headers['content-type'] === 'text/plain') {
                reply.data = requestBody;

                return reply;
            }

            // create args from uri
            if (uri.includes('?')) { // path has params
                params = uri.substring(6).split('&');

                params.forEach((element) => {
                    temp = element.split('=');

                    if (temp[1].includes('%5C')) { // value has escaped '\'
                        tokens = temp[1].split('%');

                        temp[1] = tokens[0];
                        for (i = 1; i < tokens.length; i++) {
                            temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                        }
                    }
                    if (element.includes('%7B%7B')) { // varible without value {{..}}
                        temp[1] = '{{' + temp[1].substring(6, temp[1].length - 6) + '}}';
                    }
                    else if (reply.args[temp[0]] === undefined) { // yet to be assigned
                        reply.args[temp[0]] = temp[1];
                    }
                    else if (typeof reply.args[temp[0]] === 'string' || reply.args[temp[0]] instanceof String) {
                        // already has one value
                        var arr = [];

                        arr[0] = reply.args[temp[0]];
                        arr.push(temp[1]);
                        reply.args[temp[0]] = arr;
                    }
                    else { // already is an array
                        reply.args[temp[0]].push(temp[1]);
                    }
                });
            }

            // create form from requestBody
            if (typeof requestBody === 'string' || requestBody instanceof String) {
                if (!requestBody.includes(' ')) { // x-www-urlencoded
                    query = requestBody.split('&');

                    query.forEach((element) => {
                        temp = element.split('=');

                        if (temp[1] && temp[1].includes('%5C')) {
                            tokens = temp[1].split('%');

                            temp[1] = tokens[0];
                            for (i = 1; i < tokens.length; i++) {
                                temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                            }
                        }
                        reply.form[temp[0]] = temp[1];
                    });
                }
                // form-data
                else if (!requestBody.includes('filename=')) { // usual key-value pairs
                    query = requestBody.split('\n');
                    for (i = 0; query[i + 1]; i += 4) {
                        key = (query[i + 1].split('='))[1];

                        key = key.substring(1, key.length - 2);
                        reply.form[key] = query[i + 3].substring(0, query[i + 3].length - 1);
                    }
                }
                else if (requestBody.includes('filename=')) { // contains files
                    fileNames = [];
                    tokens = requestBody.split('filename="');
                    for (i = 1; i < tokens.length; i++) {
                        fileNames[i - 1] = tokens[i].split('"')[0];
                        reply.files[fileNames[i - 1]] = 'data:application/octet-stream;base64,';
                    }
                }
            }
            else if (typeof requestBody === 'object') {
                reply.json = requestBody;
            }

            return reply;
        });
}

function mockHEADrequest () {
    nock(/http:\/\/[^localhost].*/, ALLOW_UNMOCKED)
        .persist()
        .head(/.*/)
        .query(true)
        .reply(function (uri, requestBody) {
            var reply = {
                    headers: this.req.headers,
                    args: {},
                    data: {},
                    form: {},
                    files: {}
                },
                params, // url encoded params
                temp,
                tokens,
                i,
                key,
                query,
                fileNames = [];

            if (reply.headers['content-type'] === 'text/plain') {
                reply.data = requestBody;

                return [200, reply, { 'Content-Type': 'application/json; charset=utf-8' }];
            }

            // create args from uri
            if (uri.includes('?')) { // path has params
                params = uri.substring(6).split('&');
                params.forEach((element) => {
                    temp = element.split('=');
                    if (temp[1].includes('%5C')) { // value has escaped '\'
                        tokens = temp[1].split('%');
                        temp[1] = tokens[0];
                        for (i = 1; i < tokens.length; i++) {
                            temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                        }
                    }
                    if (element.includes('%7B%7B')) { // varible without value {{..}}
                        temp[1] = '{{' + temp[1].substring(6, temp[1].length - 6) + '}}';
                    }
                    else if (reply.args[temp[0]] === undefined) { // yet to be assigned
                        reply.args[temp[0]] = temp[1];
                    }
                    // eslint-disable-next-line max-len
                    else if (typeof reply.args[temp[0]] === 'string' || reply.args[temp[0]] instanceof String) { // already has one value
                        var arr = [];

                        arr[0] = reply.args[temp[0]];
                        arr.push(temp[1]);
                        reply.args[temp[0]] = arr;
                    }
                    else { // already is an array
                        reply.args[temp[0]].push(temp[1]);
                    }
                });
            }

            // create form from requestBody
            if (typeof requestBody === 'string' || requestBody instanceof String) {
                if (!requestBody.includes(' ')) { // x-www-urlencoded
                    query = requestBody.split('&');

                    query.forEach((element) => {
                        var temp = element.split('=');

                        if (temp[1] && temp[1].includes('%5C')) {
                            tokens = temp[1].split('%');
                            temp[1] = tokens[0];
                            for (i = 1; i < tokens.length; i++) {
                                temp[1] = temp[1] + '\\' + tokens[i].substring(2);
                            }
                        }
                        reply.form[temp[0]] = temp[1];
                    });
                }
                else if (!requestBody.includes('filename=')) { // usual key-value pairs
                    tokens = requestBody.split('\n');
                    for (i = 0; tokens[i + 1]; i += 4) {
                        key = (tokens[i + 1].split('='))[1];
                        key = key.substring(1, key.length - 2);
                        reply.form[key] = tokens[i + 3].substring(0, tokens[i + 3].length - 1);
                    }
                }
                else { // contains files
                    tokens = requestBody.split('filename="');
                    for (i = 1; i < tokens.length; i++) {
                        fileNames[i - 1] = tokens[i].split('"')[0];
                        reply.files[fileNames[i - 1]] = 'data:application/octet-stream;base64,';
                    }
                }
            }
            else if (typeof requestBody === 'object') {
                reply.json = requestBody;
            }

            return [200, reply, { 'Content-Type': 'application/json; charset=utf-8' }];
        });
}

function mockOPTIONSrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .options('/get')
        .reply(200, 'GET,HEAD,PUT,POST,DELETE,PATCH');
}

function mockDIGESTAUTHrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get('/digest-auth')
        .reply(function () {
            if (this.req.headers.authorization === undefined) {
                return [401,
                    'Unauthorized',
                    // eslint-disable-next-line max-len
                    { 'WWW-Authenticate': 'Digest realm="Users", nonce="8g7dZkamuhcrPzXatt7LnTZYDGAnJe5k", qop="auth"'
                    }];
            }

            return [200, { authenticated: true }, this.req.headers];
        });
}

function mockBASICAUTHrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get('/basic-auth')
        .reply(function () {
            if (this.req.headers.authorization === undefined) {
                return [401, 'Unauthorized', {}];
            }

            return [200, { authenticated: 'true' }, this.req.headers];
        });
}

function mockOAUTH1request () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get('/oauth1')
        .query(true)
        .reply(function () {
            if (this.req.headers.authorization === undefined) {
                return [401, {
                    status: 'fail',
                    message: 'Timestamp is missing or is not a number'
                }, this.req.headers];
            }

            return [200, {
                status: 'pass',
                message: 'OAuth-1.0a signature verification was successful'
            }, this.req.headers];
        });
}

function mockHAWKAUTHrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get('/auth/hawk')
        .reply(function () {
            if (this.req.headers.authorization === undefined) {
                return [401, {
                    statusCode: 401,
                    error: 'Unauthorized'
                }, this.req.headers];
            }

            return [200, {
                message: 'Hawk Authentication Successful'
            }, this.req.headers];
        });
}

function mockSTATUSendpoint () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .get(/\/status\/.*/)
        .reply(function (uri) {
            var reply = {
                    // uri: /status/x
                    status: parseInt(uri.substring(8, uri.length), 10)
                },
                headers = this.req.headers;

            headers['Content-Type'] = 'application/json; charset=utf-8';

            return [uri.substr(-3), reply, headers];
        });
}

function mockTYPEendpoint () {
    /*  supported types:
     *  /type/xml
     *  /type/html
     *  /type/json
     */
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get(/\/type.*/)
        .reply(function (uri) {
            var resHeader = {
                    'Content-Encoding': 'gzip',
                    Server: 'nginx',
                    'set-cookie': 'sails.sid=xxxxxxxxxxxxxxxxxx; Path=/; HttpOnly',
                    Vary: 'Accept-Encoding',
                    'Content-Length': '109',
                    Connection: 'keep-alive'
                },
                body;

            if (uri.substring(6, 9) === 'xml') {
                resHeader['Content-Type'] = 'application/xml; charset=utf-8';
                body =
                // eslint-disable-next-line max-len
                '<?xml version="1.0" encoding="utf-8"?><food><key>Homestyle Breakfast</key><value>950</value></food>';
            }
            else if (uri.substring(6, 10) === 'html') {
                resHeader['Content-Type'] = 'application/html; charset=utf-8';
                body =
                // eslint-disable-next-line max-len
                '<!DOCTYPE html><html><head><title>Hello World!</title></head><body><h1>Hello World!</h1></body></html>';
            }
            else if (uri.substring(6, 10) === 'json') {
                resHeader['Content-Type'] = 'application/json; charset=utf-8';
                body = {
                    alpha: {
                        beta: {
                            gamma: true,
                            delta: [],
                            epsilon: {},
                            phi: 1.618,
                            pi: 3.14
                        }
                    }
                };
            }

            return [200, body, resHeader];
        });
}

function mockGZIPendpoint () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get('/gzip')
        .reply(function () {
            return [
                200,
                {
                    gzipped: true,
                    headers: {
                        'x-forwarded-proto': 'https',
                        host: 'postman-echo.com',
                        accept: '*/*',
                        'accept-encoding': 'gzip, deflate',
                        'cache-control': 'no-cache',
                        cookie: 'sails.sid=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx; foo=bar',
                        'postman-token': '1c51c9ac-e4b4-40c0-a821-9317d70d9dc1',
                        'user-agent': /PostmanRuntime\/.\..\../, // to match any version
                        'x-forwarded-port': '443'
                    },
                    method: 'GET'
                },
                this.req.headers
            ];
        });
}

function mockRedirects () {
    nock(/https:\/\/.*.com\//, ALLOW_UNMOCKED)
        .persist()
        // .log(console.log)
        .get(/\/redirect-to.*/)
        // .query(true)
        .reply(function () {
            return [302, {
                args: {},
                headers: {
                    'x-forwarded-proto': 'https',
                    host: 'postman-echo.com',
                    accept: '*/*',
                    'accept-encoding': 'gzip, deflate',
                    'cache-control': 'no-cache',
                    cookie: 'sails.sid=xxxxxxxxxxxxxxxxxxxxx; foo=bar',
                    'postman-token': 'c4467e84-85cd-4ea1-bfa4-5d0ddf855025',
                    referer: 'https://postman-echo.com/redirect-to?url=https://postman-echo.com/get',
                    'user-agent': /PostmanRuntime\/.\..\../, // to match any version
                    'x-forwarded-port': '443'
                },
                url: 'https://postman-echo.com/get'
            }, this.req.headers];
        });
}

function mockDELAYrequest () {
    nock('https://postman-echo.com', ALLOW_UNMOCKED)
        .persist()
        .get(/\/delay.*/)
        .query(true)
        .reply(200, function (uri) {
            var reply = { };

            // uri: /delay/x
            reply.delay = uri.substring(7, uri.length);

            return reply;
        }, {
            'Content-Type': 'application/json; charset=utf-8',
            Server: 'nginx',
            'set-cookie': 'sails.sid=xxxxxxxxxxxxxxxxxx; Path=/; HttpOnly',
            Vary: 'Accept-Encoding',
            'Content-Length': '13',
            Connection: 'keep-alive'
        });
}

function applyMocks () {
    if (!TURN_OFF_NOCK) {
        console.info('\nRequests from this script are being mocked!\n'.green);
        mockGETrequest();
        mockPOSTrequest();
        mockPUTrequest();
        mockPATCHrequest();
        mockDELETErequest();
        mockHEADrequest();
        mockOPTIONSrequest();
        mockDIGESTAUTHrequest();
        mockBASICAUTHrequest();
        mockOAUTH1request();
        mockHAWKAUTHrequest();
        mockTYPEendpoint();
        mockGZIPendpoint();
        mockSTATUSendpoint();
        mockDELAYrequest();
        mockRedirects();
    }
}

function removeMocks () {
    if (!TURN_OFF_NOCK) {
        console.info('Mocks will be uninstalled...'.green);
        nock.cleanAll();
    }
}

module.exports = {
    TURN_OFF_NOCK,
    ALLOW_UNMOCKED,
    applyMocks,
    removeMocks
};

/* ++++++++++++++++++
 * + UNMOCKED items +
 * ++++++++++++++++++
 * GET https://postman-echo.com/response-headers?Content-Type= semicolon-test collection
 * OAuth1.0 params in url
 * OAuth2.0 postman runtime requires net access, echo-v2 collection
 * v2 regression tests : 3 requests
 * cookie-jar
 *
 */
