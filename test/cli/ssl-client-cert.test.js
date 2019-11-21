var fs = require('fs'),
    https = require('https');

describe('SSL Client certificates', function () {
    var server, server2;

    before(function (done) {
        server = https.createServer({
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

        server.listen(3000);
        server2.listen(3001);
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

    it('should not work when both client certificate options are used', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/multiple-ssl-client-certs.json --ssl-client-certs test/fixtures/ssl/sslClientCerts.json --ssl-client-cert test/fixtures/ssl/client.crt --ssl-client-key test/fixtures/ssl/client.key --ssl-client-passphrase password -k', function (code) {
            expect(code, 'should have exit code different than 0').to.not.equal(0);
            done();
        });
    });

    it('should work correctly with multiple client certificates', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/multiple-ssl-client-certs.json --verbose --ssl-client-certs ./test/fixtures/ssl/sslClientCerts.json -k', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    after(function (done) {
        server.close();
        server2.close();
        done();
    });
});
