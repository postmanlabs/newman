var fs = require('fs'),
    https = require('https');

describe('SSL Client certificates', function () {
    var server;

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

        server.listen(3000, done);
    });

    // @todo: add .pfx, .pem tests as well
    it('should work correctly with standalone client certificates', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/ssl-client-cert.json --ssl-client-cert test/fixtures/ssl/client.crt --ssl-client-key test/fixtures/ssl/client.key --ssl-client-passphrase password -k', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    after(function (done) {
        server.close(done);
    });
});
