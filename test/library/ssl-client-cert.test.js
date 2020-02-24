var fs = require('fs'),
    async = require('async'),
    expect = require('chai').expect,
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
            sslClientCertList: 'test/fixtures/files/ssl-client-cert-config.json',
            insecure: true
        }, done);
    });

    it('should give precedence to client cert list when both client cert options present', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'test/fixtures/files/ssl-client-cert-config.json',
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should fallback to individual client cert when multiple client cert don\'t match', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert.json',
            sslClientCertList: 'test/fixtures/files/ssl-client-cert-config.json',
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should bail out if client certificate list file does not exist', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'invalid-cert-file.json', // using an invalid cert list
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message)
                .to.equal('newman: unable to read the ssl client certificates file "invalid-cert-file.json"');
            done();
        });
    });

    it('should bail out if unable to parse client certificate list', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: './ssl-client-cert-test.js', // using an invalid cert list
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message)
                .to.equal('newman: unable to read the ssl client certificates file "./ssl-client-cert-test.js"');
            done();
        });
    });

    it('should bail out if client certificate list is not array', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'test/fixtures/run/ssl-client-cert.json', // using an invalid cert list
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message).to.equal('newman: expected ssl client certificates list to be an array.');
            done();
        });
    });

    it('should use list if list is an array', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: [{
                name: 'client1',
                matches: ['https://localhost:3001', 'https://localhost:3001/*'],
                key: { src: './test/fixtures/ssl/client2.key' },
                cert: { src: './test/fixtures/ssl/client2.crt' },
                passphrase: 'password'
            }],
            insecure: true
        }, done);
    });

    it('should bail if client certificate list file path is invalid', function (done) {
        newman.run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: {},
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message).to.equal('newman: path for ssl client certificates list file must be a string');
            done();
        });
    });
});
