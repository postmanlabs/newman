var fs = require('fs'),
    https = require('https');

describe('SSL Client certificates', function () {
    var server;

    before(function (done) {
        server = https.createServer({
            key: fs.readFileSync('test/fixtures/server.key', 'utf8'),
            cert: fs.readFileSync('test/fixtures/server.crt', 'utf8'),
            ca: fs.readFileSync('test/fixtures/ca.crt', 'utf8'),
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

        server.listen(3000, done);
    });

    // @todo: add .pfx, .pem tests as well
    it('should work correctly with standalone client certificates', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/cli/ssl-client-cert.json --ssl-client-cert test/fixtures/client.crt --ssl-client-key test/fixtures/client.key --ssl-client-passphrase password -k', function (code) {
            expect(code).be(0);
            done();
        });
    });

    after(function (done) {
        server.close(done);
    });
});
