var fs = require('fs'),
    async = require('async'),
    https = require('https');

describe('SSL Client certificates', function () {
    var server1, server2, server3;

    function createHttpsServerWithCerts (certs) {
        return https.createServer({
            key: fs.readFileSync(certs.key, 'utf8'),
            cert: fs.readFileSync(certs.cert, 'utf8'),
            ca: fs.readFileSync(certs.ca, 'utf8'),
            passphrase: 'password',
            requestCert: true,
            rejectUnauthorized: false
        }, function (req, res) {
            if (req.client.authorized) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('authorized\n');
            }
            else {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('unauthorized\n');
            }
        });
    }

    before(function (done) {
        server1 = createHttpsServerWithCerts({
            key: 'test/fixtures/ssl/server.key',
            cert: 'test/fixtures/ssl/server.crt',
            ca: 'test/fixtures/ssl/ca.crt'
        });

        server2 = createHttpsServerWithCerts({
            key: 'test/fixtures/ssl/server2.key',
            cert: 'test/fixtures/ssl/server2.crt',
            ca: 'test/fixtures/ssl/ca2.crt'
        });

        server3 = createHttpsServerWithCerts({
            key: 'test/fixtures/ssl/server3.key',
            cert: 'test/fixtures/ssl/server3.crt',
            ca: 'test/fixtures/ssl/ca3.crt'
        });

        async.parallel([
            function (cb) {
                server1.listen(3000, cb);
            },
            function (cb) {
                server2.listen(3001, cb);
            },
            function (cb) {
                server3.listen(3002, cb);
            }
        ], function (err) {
            done(err);
        });
    });

    after(function (done) {
        async.parallel([
            function (cb) {
                server1.close(cb);
            },
            function (cb) {
                server2.close(cb);
            },
            function (cb) {
                server3.close(cb);
            }
        ], function (err) {
            done(err);
        });
    });

    // @todo: add .pfx, .pem tests as well
    it('should work correctly with standalone client certificates', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/ssl-client-cert.json --ssl-client-cert test/fixtures/ssl/client.crt --ssl-client-key test/fixtures/ssl/client.key --ssl-client-passphrase password -k', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should work correctly with a trusted CA certificate provided', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/ssl-client-cert.json --ssl-client-cert test/fixtures/ssl/client.crt --ssl-client-key test/fixtures/ssl/client.key --ssl-client-passphrase password --ssl-extra-ca-certs test/fixtures/ssl/ca.crt', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should work correctly with multiple client certificates', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json --verbose --ssl-client-cert-list ./test/fixtures/files/ssl-client-cert-config.json -k', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should use certificate from list when both client certificates options are used', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list test/fixtures/files/ssl-client-cert-config.json' +
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        exec(cmd, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should fallback to individual client cert when no cert from list match', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/ssl-client-cert.json' +
            ' --ssl-client-cert-list test/fixtures/files/ssl-client-cert-config.json' +
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        exec(cmd, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should bail out if client certificate list file does not exist', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list invalid-cert-file.json' + // using an invalid cert list
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        exec(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });

    it('should bail out if unable to parse client certificate list', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list test/cli/ssl-client-cert-test.js' + // using an invalid cert list
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        exec(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });

    it('should bail out if client certificate list is not an array', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list test/fixtures/run/ssl-client-cert.json' + // using an invalid cert list
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        exec(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });
});
