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

        server1.listen(3000);
        server2.listen(3001);
        server3.listen(3002);
        done();
    });

    after(function (done) {
        server1.close();
        server2.close();
        server3.close();
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
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'test/fixtures/ssl/sslClientCertList.json',
            insecure: true
        }, done);
    });

    it('should give precedence to client cert list when both client cert options present', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'test/fixtures/ssl/sslClientCertList.json',
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should fallback to individual client cert when multiple client cert don\'t match', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert.json',
            sslClientCertList: 'test/fixtures/ssl/sslClientCertList.json',
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });
});
