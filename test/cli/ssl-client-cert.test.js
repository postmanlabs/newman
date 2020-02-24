var fs = require('fs'),
    https = require('https');

describe('SSL Client certificates', function () {
    var server1, server2, server3;

    before(function (done) {
        server1 = https.createServer({
            key: fs.readFileSync('test/fixtures/ssl/server.key', 'utf8'),
            cert: fs.readFileSync('test/fixtures/ssl/server.crt', 'utf8'),
            ca: fs.readFileSync('test/fixtures/ssl/ca.crt', 'utf8'),
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

        server2 = https.createServer({
            key: fs.readFileSync('test/fixtures/ssl/server2.key', 'utf8'),
            cert: fs.readFileSync('test/fixtures/ssl/server2.crt', 'utf8'),
            ca: fs.readFileSync('test/fixtures/ssl/ca2.crt', 'utf8'),
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

        server3 = https.createServer({
            key: fs.readFileSync('test/fixtures/ssl/server3.key', 'utf8'),
            cert: fs.readFileSync('test/fixtures/ssl/server3.crt', 'utf8'),
            ca: fs.readFileSync('test/fixtures/ssl/ca3.crt', 'utf8'),
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

        server1.listen(3000);
        server2.listen(3001);
        server3.listen(3002);
        done();
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
        exec('node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json --verbose --ssl-client-cert-list ./test/fixtures/ssl/sslClientCertList.json -k', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should use certificate from list when both client certificates options are used', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list test/fixtures/ssl/sslClientCertList.json' +
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
            ' --ssl-client-cert-list test/fixtures/ssl/sslClientCertList.json' +
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        exec(cmd, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should bail out if unable to parse client certificate list', function (done) {
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

    it('should bail out if invalid client certificate list', function (done) {
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

    after(function (done) {
        server1.close();
        server2.close();
        server3.close();
        done();
    });
});
