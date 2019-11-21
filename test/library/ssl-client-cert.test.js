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

    after(function (done) {
        server.close();
        server2.close();
        done();
    });

    // @todo: add .pfx, .pem tests as well
    it('should work correctly with standalone client certificates', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert.json',
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should work correctly with multiple client certificates', function (done) {
        newman.run({
            collection: 'test/fixtures/run/multiple-ssl-client-certs.json',
            sslClientCerts: 'test/fixtures/ssl/sslClientCerts.json',
            insecure: true
        }, done);
    });
});
