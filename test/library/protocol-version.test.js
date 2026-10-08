const fs = require('fs'),
    http = require('http'),
    http2 = require('http2'),
    https = require('https'),
    expect = require('chai').expect,
    enableServerDestroy = require('server-destroy'),

    newman = require('../../'),

    SERVER_CERTS = {
        key: 'test/fixtures/ssl/server.key',
        cert: 'test/fixtures/ssl/server.crt',
        passphrase: 'password'
    };

describe('newman.run protocolVersion', function () {
    // the negotiated protocol is only observable from the server side, hence the local servers
    let alpnServer,
        http1Server,
        plainServer,
        httpVersions;

    function handler (req, res) {
        httpVersions.push(req.httpVersion);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
    }

    function tlsOptions () {
        return {
            key: fs.readFileSync(SERVER_CERTS.key),
            cert: fs.readFileSync(SERVER_CERTS.cert),
            passphrase: SERVER_CERTS.passphrase
        };
    }

    function run (url, options, done) {
        httpVersions = [];

        newman.run({
            collection: { item: [{ request: { url: url, method: 'GET' } }] },
            insecure: true, // the fixture certificates are self-signed
            ...options
        }, function (err, summary) {
            done(err, summary, httpVersions[0]);
        });
    }

    before(function (done) {
        alpnServer = http2.createSecureServer({ allowHTTP1: true, ...tlsOptions() }, handler);
        http1Server = https.createServer(tlsOptions(), handler);
        plainServer = http.createServer(handler);

        enableServerDestroy(alpnServer);
        enableServerDestroy(http1Server);
        enableServerDestroy(plainServer);

        alpnServer.listen(0, function () {
            http1Server.listen(0, function () {
                plainServer.listen(0, done);
            });
        });
    });

    after(function (done) {
        alpnServer.destroy(function () {
            http1Server.destroy(function () {
                plainServer.destroy(done);
            });
        });
    });

    it('should default to auto and negotiate HTTP/2 when the server supports it', function (done) {
        run(`https://localhost:${alpnServer.address().port}/`, {}, function (err, summary, httpVersion) {
            expect(err).to.be.null;
            expect(summary.run.failures).to.be.an('array').that.is.empty;
            expect(httpVersion).to.equal('2.0');
            done();
        });
    });

    it('should fall back to HTTP/1.1 when the server does not negotiate HTTP/2', function (done) {
        run(`https://localhost:${http1Server.address().port}/`, {}, function (err, summary, httpVersion) {
            expect(err).to.be.null;
            expect(summary.run.failures).to.be.an('array').that.is.empty;
            expect(httpVersion).to.equal('1.1');
            done();
        });
    });

    it('should use HTTP/1.1 when there is no TLS to negotiate over', function (done) {
        run(`http://localhost:${plainServer.address().port}/`, {}, function (err, summary, httpVersion) {
            expect(err).to.be.null;
            expect(summary.run.failures).to.be.an('array').that.is.empty;
            expect(httpVersion).to.equal('1.1');
            done();
        });
    });

    it('should use HTTP/2 when explicitly requested', function (done) {
        run(`https://localhost:${alpnServer.address().port}/`, { protocolVersion: 'http2' },
            function (err, summary, httpVersion) {
                expect(err).to.be.null;
                expect(summary.run.failures).to.be.an('array').that.is.empty;
                expect(httpVersion).to.equal('2.0');
                done();
            });
    });

    it('should use HTTP/1.1 when explicitly requested, even if HTTP/2 is on offer', function (done) {
        run(`https://localhost:${alpnServer.address().port}/`, { protocolVersion: 'http1' },
            function (err, summary, httpVersion) {
                expect(err).to.be.null;
                expect(summary.run.failures).to.be.an('array').that.is.empty;
                expect(httpVersion).to.equal('1.1');
                done();
            });
    });
});
