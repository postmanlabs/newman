const fs = require('fs'),
    http2 = require('http2'),
    expect = require('chai').expect,
    enableServerDestroy = require('server-destroy'),

    COLLECTION = 'test/fixtures/run/protocol-version.json';

describe('newman run --protocol-version', function () {
    // the server offers both protocols, so the flag decides which one gets used
    let server,
        httpVersions;

    function run (args, callback) {
        httpVersions = [];

        exec(`node ./bin/newman.js run ${COLLECTION} --env-var url=https://localhost:${server.address().port}/ -k ${args}`,
            function (code, stdout, stderr) {
                callback(code, stderr, httpVersions[0]);
            });
    }

    before(function (done) {
        server = http2.createSecureServer({
            key: fs.readFileSync('test/fixtures/ssl/server.key'),
            cert: fs.readFileSync('test/fixtures/ssl/server.crt'),
            passphrase: 'password',
            allowHTTP1: true
        }, function (req, res) {
            httpVersions.push(req.httpVersion);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{}');
        });

        enableServerDestroy(server);
        server.listen(0, done);
    });

    after(function (done) {
        server.destroy(done);
    });

    it('should default to auto and negotiate HTTP/2 when the option is absent', function (done) {
        run('', function (code, stderr, httpVersion) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(httpVersion).to.equal('2.0');
            done();
        });
    });

    it('should negotiate HTTP/2 with auto', function (done) {
        run('--protocol-version auto', function (code, stderr, httpVersion) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(httpVersion).to.equal('2.0');
            done();
        });
    });

    it('should use HTTP/2 with http2', function (done) {
        run('--protocol-version http2', function (code, stderr, httpVersion) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(httpVersion).to.equal('2.0');
            done();
        });
    });

    it('should use HTTP/1.1 with http1', function (done) {
        run('--protocol-version http1', function (code, stderr, httpVersion) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(httpVersion).to.equal('1.1');
            done();
        });
    });

    it('should throw an error for a missing protocol version', function (done) {
        run('--protocol-version', function (code, stderr) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr).to.contain('option \'--protocol-version <value>\' argument missing');
            done();
        });
    });
});
