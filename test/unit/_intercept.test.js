/* eslint-disable n/no-process-env */
const fs = require('fs'),
    http = require('http'),
    net = require('net'),
    path = require('path'),
    tls = require('tls'),

    expect = require('chai').expect,
    sinon = require('sinon'),

    intercept = require('../fixtures/servers/intercept'),

    CA_FILE = path.join(__dirname, '..', 'fixtures', 'ssl', 'ca.crt'),
    CA_CONTENTS = fs.readFileSync(CA_FILE).toString(),

    ECHO_HTTP_PORT = 18080,
    ECHO_HTTPS_PORT = 18443,
    BLACKHOLE_HOST = '123.random.z',
    LIVE_HOST = 'expired.badssl.com',

    // the same unregistered symbol Node uses to mark an already normalized argument array
    NORMALIZED_ARGS_SYMBOL = Object.getOwnPropertySymbols(net._normalizeArgs([]))[0],

    DEFAULT_HOSTS = {
        'postman-echo.com': { http: ECHO_HTTP_PORT, https: ECHO_HTTPS_PORT },
        'api.postman.com': { https: ECHO_HTTPS_PORT }
    };

function policy (hosts) {
    return {
        block: true,
        blackhole: [BLACKHOLE_HOST],
        live: [LIVE_HOST],
        hosts: hosts === undefined ? DEFAULT_HOSTS : hosts,
        caFile: CA_FILE
    };
}

describe('network intercept', function () {
    var originalConnect,
        originalTlsConnect,
        originalExitCode,
        originalNoProxy,
        connectCalls,
        tlsCalls,
        localServer,
        ambientPolicy;

    // replaces `net.Socket.prototype.connect` with a recorder before the interceptor is installed, so the
    // interceptor's "original" becomes the recorder and every argument it forwards can be asserted against
    function stubSocketSeam () {
        net.Socket.prototype.connect = function () {
            connectCalls.push({ socket: this, args: [...arguments] });

            return this;
        };
    }

    function stubTlsSeam () {
        tls.connect = function () {
            tlsCalls.push([...arguments]);

            return { stub: true };
        };
    }

    // the raw argument list the interceptor forwarded to the original `connect`
    function forwarded (index) {
        return connectCalls[index].args;
    }

    // the options object inside the normalized array the interceptor rebuilt
    function rewritten (index) {
        return connectCalls[index].args[0][0];
    }

    function dial () {
        var socket = new net.Socket();

        socket.connect(...arguments);

        return socket;
    }

    // `npm/test-unit.js` installs a policy before mocha runs, and every test here installs one of its own and
    // uninstalls it again. So the ambient policy is stashed for the duration of this file and put back afterwards,
    // whatever shape it has.
    before(function () {
        ambientPolicy = intercept.installed();
        intercept.uninstall();
    });

    // mocha runs a suite level `after` once, following the last `afterEach`, so the reinstall lands last
    after(function () {
        if (ambientPolicy) {
            intercept.install(ambientPolicy);
        }
    });

    beforeEach(function () {
        originalConnect = net.Socket.prototype.connect;
        originalTlsConnect = tls.connect;
        originalExitCode = process.exitCode;
        originalNoProxy = Object.hasOwn(process.env, 'NO_PROXY') ? process.env.NO_PROXY : undefined;
        connectCalls = [];
        tlsCalls = [];
        localServer = null;
    });

    afterEach(function () {
        // order matters: the interceptor restores whatever was installed under it, the stubs are dropped afterwards
        intercept.uninstall();
        net.Socket.prototype.connect = originalConnect;
        tls.connect = originalTlsConnect;
        sinon.restore();

        // a blocked connection fails the run by design; that must not leak into the rest of the unit suite
        process.exitCode = originalExitCode;

        if (originalNoProxy === undefined) {
            delete process.env.NO_PROXY;
        }
        else {
            process.env.NO_PROXY = originalNoProxy;
        }

        if (localServer) {
            localServer.close();
            localServer.closeAllConnections();
            localServer = null;
        }
    });

    describe('connect argument forms', function () {
        it('should accept the options object form and carry the callback through', function () {
            var callback = sinon.spy();

            stubSocketSeam();
            intercept.install(policy());
            dial({ host: 'postman-echo.com', port: 80 }, callback);

            expect(Array.isArray(forwarded(0)[0])).to.be.true;
            expect(rewritten(0).host).to.equal('postman-echo.com');
            expect(rewritten(0).port).to.equal(ECHO_HTTP_PORT);
            expect(forwarded(0)[0][1]).to.equal(callback);
            expect(callback.called).to.be.false;
        });

        it('should accept the port and host form', function () {
            stubSocketSeam();
            intercept.install(policy());
            dial(80, 'postman-echo.com');

            expect(rewritten(0).host).to.equal('postman-echo.com');
            expect(rewritten(0).port).to.equal(ECHO_HTTP_PORT);
        });

        it('should pass the unix socket path form through untouched', function () {
            var options = { path: '/tmp/newman-hermetic.sock' };

            stubSocketSeam();
            intercept.install(policy());
            dial(options);

            expect(forwarded(0)).to.have.lengthOf(1);
            expect(forwarded(0)[0]).to.equal(options);
        });

        it('should preserve the normalized-array marking contract', function () {
            var preNormalized = net._normalizeArgs([{ host: 'postman-echo.com', port: 80 }]),
                untouched = net._normalizeArgs([{ host: '127.0.0.1', port: 4041 }]),
                replacement;

            stubSocketSeam();
            intercept.install(policy());

            // a pre-normalized array is rebuilt, but the replacement stays marked
            dial(preNormalized);
            replacement = forwarded(0)[0];
            expect(replacement).to.not.equal(preNormalized);
            expect(replacement[NORMALIZED_ARGS_SYMBOL]).to.equal(true);
            expect(replacement[0].port).to.equal(ECHO_HTTP_PORT);

            // an unmarked array is rebuilt and gets marked too
            dial([{ host: 'postman-echo.com', port: 80 }, null]);
            expect(forwarded(1)[0][NORMALIZED_ARGS_SYMBOL]).to.equal(true);

            // nothing to rewrite means the original normalized array is forwarded as-is
            dial(untouched);
            expect(forwarded(2)[0]).to.equal(untouched);
        });
    });

    describe('mapped hosts', function () {
        it('should replace only the port of a mapped http connection', function () {
            stubSocketSeam();
            intercept.install(policy());
            dial({ host: 'postman-echo.com', port: 80, family: 4, hints: 0 });

            expect(rewritten(0)).to.have.property('host', 'postman-echo.com');
            expect(rewritten(0)).to.have.property('port', ECHO_HTTP_PORT);
            expect(rewritten(0)).to.have.property('family', 4);
            expect(rewritten(0)).to.have.property('hints', 0);
        });

        it('should route a tls-eligible connection to the tls listener', function () {
            var socket;

            stubSocketSeam();
            intercept.install(policy());

            // a TLSSocket instance routes to the tls listener regardless of the port the fixture asked for
            net.Socket.prototype.connect.call(Object.create(tls.TLSSocket.prototype), {
                host: 'postman-echo.com', port: 8443
            });
            expect(rewritten(0).port).to.equal(ECHO_HTTPS_PORT);

            // the default https port routes there too
            dial({ host: 'postman-echo.com', port: 443 });
            expect(rewritten(1).port).to.equal(ECHO_HTTPS_PORT);

            // a host that only publishes a tls listener routes there regardless of the port asked for
            dial({ host: 'api.postman.com', port: 80 });
            expect(rewritten(2).port).to.equal(ECHO_HTTPS_PORT);

            // both seams patch consistently for a real `tls.connect` call, including the trust seam
            socket = tls.connect({ host: 'postman-echo.com', port: 443 });
            expect(rewritten(3).servername).to.equal('postman-echo.com');
            expect(rewritten(3).ca[0].toString()).to.equal(CA_CONTENTS);
            socket.destroy();
        });

        it('should serve a mapped http host from a local listener', function (done) {
            localServer = http.createServer(function (req, res) {
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ host: req.headers.host, url: req.url }));
            });

            localServer.listen(0, '127.0.0.1', function () {
                intercept.install(policy({ 'postman-echo.com': { http: localServer.address().port } }));

                http.get('http://postman-echo.com/get?a=1', { agent: false }, function (res) {
                    var body = '';

                    res.on('data', function (chunk) { body += chunk; });
                    res.on('end', function () {
                        expect(res.statusCode).to.equal(200);
                        expect(JSON.parse(body)).to.eql({ host: 'postman-echo.com', url: '/get?a=1' });

                        return done();
                    });
                });
            });
        });
    });

    describe('option cloning', function () {
        it('should not mutate the caller options object, mapped or blackholed', function () {
            var portSetter = sinon.spy(),
                lookupSetter = sinon.spy(),
                mapped = { host: 'postman-echo.com' },
                blackholed = { host: BLACKHOLE_HOST, port: 80 };

            Object.defineProperty(mapped, 'port', {
                get: function () { return 80; },
                set: portSetter,
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(mapped, 'lookup', {
                get: function () { return undefined; },
                set: lookupSetter,
                enumerable: true,
                configurable: true
            });

            stubSocketSeam();
            intercept.install(policy());

            dial(mapped);
            expect(portSetter.called).to.be.false;
            expect(lookupSetter.called).to.be.false;
            expect(mapped.port).to.equal(80);
            expect(mapped.lookup).to.equal(undefined);
            expect(rewritten(0)).to.not.equal(mapped);
            expect(rewritten(0).port).to.equal(ECHO_HTTP_PORT);

            dial(blackholed);
            expect(blackholed).to.eql({ host: BLACKHOLE_HOST, port: 80 });
            expect(rewritten(1)).to.not.equal(blackholed);
            expect(rewritten(1).lookup).to.be.a('function');
        });
    });

    describe('lookup', function () {
        function mappedLookup () {
            stubSocketSeam();
            intercept.install(policy());
            dial({ host: 'postman-echo.com', port: 80 });

            return rewritten(0).lookup;
        }

        it('should never call back in the same tick', function (done) {
            var returned = false;

            // Node's resolver is never synchronous, and a same-tick one collapses the measured DNS phase to zero,
            // dropping the `average DNS lookup time:` row from the CLI reporter
            mappedLookup()('postman-echo.com', { hints: 1024, all: true }, function () {
                expect(returned, 'resolver called back before connect returned').to.be.true;

                return done();
            });

            returned = true;
        });

        it('should resolve a mapped host to the ipv4 loopback in every options shape', function (done) {
            var lookup = mappedLookup();

            lookup('postman-echo.com', { family: 4, hints: 0 }, function () {
                expect([...arguments]).to.eql([null, '127.0.0.1', 4]);

                lookup('postman-echo.com', { hints: 1024, all: true }, function () {
                    expect([...arguments]).to.eql([null, [{ address: '127.0.0.1', family: 4 }]]);

                    lookup('postman-echo.com', undefined, function () {
                        expect([...arguments]).to.eql([null, '127.0.0.1', 4]);

                        return done();
                    });
                });
            });
        });
    });

    describe('blackhole', function () {
        function blackholeError (host, callback) {
            stubSocketSeam();
            intercept.install(policy());
            dial({ host: host, port: 80 });
            rewritten(0).lookup(host, {}, callback);
        }

        it('should fail resolution asynchronously with the standard ENOTFOUND shape', function (done) {
            var returned = false;

            blackholeError(BLACKHOLE_HOST, function (error) {
                expect(returned, 'resolver failed before connect returned').to.be.true;
                expect(error.message).to.equal('getaddrinfo ENOTFOUND ' + BLACKHOLE_HOST);
                expect(error.code).to.equal('ENOTFOUND');
                expect(error.errno).to.equal('ENOTFOUND');
                expect(error.syscall).to.equal('getaddrinfo');
                expect(error.hostname).to.equal(BLACKHOLE_HOST);

                return done();
            });

            returned = true;
        });

        it('should not fail the run', function (done) {
            blackholeError(BLACKHOLE_HOST, function () {
                expect(process.exitCode).to.equal(originalExitCode);

                return done();
            });
        });
    });

    describe('block mode', function () {
        it('should reject an unmapped hostname through the socket error path', function (done) {
            intercept.install(policy());

            dial(80, 'unmapped.invalid').on('error', function (err) {
                expect(err.message).to.equal('getaddrinfo EHERMETIC unmapped.invalid' + intercept.BLOCKED_HINT);
                expect(err.code).to.equal('EHERMETIC');
                expect(err.errno).to.equal('EHERMETIC');
                expect(err.syscall).to.equal('getaddrinfo');
                expect(err.hostname).to.equal('unmapped.invalid');
                expect(process.exitCode).to.equal(1);

                return done();
            });
        });

        it('should reject an unmapped literal ip address, v4 or v6, directly at connect time', function (done) {
            // Node resolves an IP literal itself and never calls `lookup`, so this is a separate branch from the
            // hostname case above
            function rejects (literal, next) {
                dial(80, literal).on('error', function (err) {
                    expect(err.message).to.equal('getaddrinfo EHERMETIC ' + literal + intercept.BLOCKED_HINT);
                    expect(err.code).to.equal('EHERMETIC');
                    expect(process.exitCode).to.equal(1);

                    return next();
                });
            }

            intercept.install(policy());

            rejects('203.0.113.7', function () {
                rejects('2001:db8::1', done);
            });
        });

        it('should never reach the original connect for a rejected literal address', function (done) {
            stubSocketSeam();
            intercept.install(policy());

            dial(80, '203.0.113.7').on('error', function () {
                expect(connectCalls).to.have.lengthOf(0);

                return done();
            });
        });

        it('should pass a live host, a disabled policy, and every loopback form through untouched', function () {
            var liveOptions = { host: LIVE_HOST, port: 443 },
                disabledOptions = { host: 'example.com', port: 443 },
                unblocked = policy(),
                loopbackHosts = ['localhost', 'LOCALHOST', '127.0.0.1', '127.9.9.9', '::1', '[::1]',
                    '0:0:0:0:0:0:0:1', '::ffff:127.0.0.1'],
                seen = 0;

            stubSocketSeam();
            intercept.install(policy());
            dial(liveOptions);
            expect(forwarded(seen++)[0]).to.equal(liveOptions);
            intercept.uninstall();

            unblocked.block = false;
            intercept.install(unblocked);
            dial(disabledOptions);
            expect(forwarded(seen++)[0]).to.equal(disabledOptions);
            intercept.uninstall();

            intercept.install(policy());
            loopbackHosts.forEach(function (host) {
                var options = { host: host, port: 4041 };

                dial(options);
                expect(forwarded(seen)[0], host).to.equal(options);
                seen++;
            });

            expect(connectCalls).to.have.lengthOf(seen);
            expect(process.exitCode).to.equal(originalExitCode);
        });

        it('should leave a unix socket alone even when block is on', function () {
            var options = { path: '/tmp/newman-hermetic-2.sock' };

            stubSocketSeam();
            intercept.install(policy());
            dial(options);

            expect(forwarded(0)[0]).to.equal(options);
            expect(process.exitCode).to.equal(originalExitCode);
        });
    });

    describe('tls trust seam', function () {
        it('should inject the fixture ca and servername for a mapped host, leaving port and host alone', function () {
            stubTlsSeam();
            intercept.install(policy());
            tls.connect({ host: 'postman-echo.com', port: 443 });

            expect(tlsCalls[0][0].ca).to.have.lengthOf(1);
            expect(tlsCalls[0][0].ca[0].toString()).to.equal(CA_CONTENTS);
            expect(tlsCalls[0][0].servername).to.equal('postman-echo.com');
            expect(tlsCalls[0][0].port).to.equal(443);
            expect(tlsCalls[0][0].host).to.equal('postman-echo.com');
            expect(tlsCalls[0][0]).to.not.have.property('lookup');
        });

        it('should respect an existing server name', function () {
            stubTlsSeam();
            intercept.install(policy());
            tls.connect({ host: 'postman-echo.com', port: 443, servername: 'httpbin.org' });

            expect(tlsCalls[0][0].servername).to.equal('httpbin.org');
        });

        it('should append to an existing ca list or single value', function () {
            stubTlsSeam();
            intercept.install(policy());

            tls.connect({ host: 'postman-echo.com', port: 443, ca: ['existing-a', 'existing-b'] });
            expect(tlsCalls[0][0].ca).to.have.lengthOf(3);
            expect(tlsCalls[0][0].ca[0]).to.equal('existing-a');
            expect(tlsCalls[0][0].ca[2].toString()).to.equal(CA_CONTENTS);

            tls.connect({ host: 'postman-echo.com', port: 443, ca: 'existing' });
            expect(tlsCalls[1][0].ca).to.eql(['existing', fs.readFileSync(CA_FILE)]);
        });

        it('should not mutate the caller tls options object', function () {
            var options = { host: 'postman-echo.com', port: 443 };

            stubTlsSeam();
            intercept.install(policy());
            tls.connect(options);

            expect(options).to.eql({ host: 'postman-echo.com', port: 443 });
            expect(tlsCalls[0][0]).to.not.equal(options);
        });

        it('should not inject a ca or servername for a live, unmapped, or unix socket destination', function () {
            var liveOptions = { host: LIVE_HOST, port: 443 },
                unmappedOptions = { host: 'example.com', port: 443 },
                unixOptions = { path: '/tmp/newman-hermetic-3.sock', host: 'postman-echo.com' };

            stubTlsSeam();
            intercept.install(policy());

            tls.connect(liveOptions);
            expect(tlsCalls[0]).to.have.lengthOf(1);
            expect(tlsCalls[0][0]).to.equal(liveOptions);
            expect(liveOptions).to.not.have.property('ca');
            expect(liveOptions).to.not.have.property('servername');

            tls.connect(unmappedOptions);
            expect(tlsCalls[1][0]).to.equal(unmappedOptions);

            tls.connect(unixOptions);
            expect(tlsCalls[2][0]).to.equal(unixOptions);
        });

        it('should preserve the port, host, options and callback form', function () {
            var callback = sinon.spy();

            stubTlsSeam();
            intercept.install(policy());

            // this is the exact shape `http2.connect` uses, port included as a string
            tls.connect('443', 'postman-echo.com', { ALPNProtocols: ['h2'], servername: 'postman-echo.com' },
                callback);

            expect(tlsCalls[0][0].port).to.equal('443');
            expect(tlsCalls[0][0].host).to.equal('postman-echo.com');
            expect(tlsCalls[0][0].ALPNProtocols).to.eql(['h2']);
            expect(tlsCalls[0][0].ca[0].toString()).to.equal(CA_CONTENTS);
            expect(tlsCalls[0][1]).to.equal(callback);
        });
    });

    describe('install and uninstall', function () {
        it('should report installed state accurately', function () {
            var installed = policy();

            // the suite level `before` stashed the unit runner's policy, so this really is a clean slate
            expect(intercept.installed()).to.be.null;

            intercept.install(installed);
            expect(intercept.installed()).to.equal(installed);
        });

        it('should patch both seams exactly once', function () {
            var patchedConnect,
                patchedTlsConnect;

            intercept.install(policy());
            patchedConnect = net.Socket.prototype.connect;
            patchedTlsConnect = tls.connect;

            expect(patchedConnect).to.not.equal(originalConnect);
            expect(patchedTlsConnect).to.not.equal(originalTlsConnect);

            intercept.install(policy());

            expect(net.Socket.prototype.connect).to.equal(patchedConnect);
            expect(tls.connect).to.equal(patchedTlsConnect);
        });

        it('should throw when installed over a different policy', function () {
            intercept.install(policy());

            expect(function () {
                intercept.install(policy({}));
            }).to.throw(/already installed with a different policy/);
        });

        it('should be safe to uninstall when nothing is installed', function () {
            expect(function () {
                intercept.uninstall();
                intercept.uninstall();
            }).to.not.throw();
        });

        it('should never save its own patch as the original', function () {
            var patched;

            stubSocketSeam();
            stubTlsSeam();
            intercept.install(policy());
            patched = net.Socket.prototype.connect;
            intercept.uninstall();

            // a caller that snapshotted `connect` while a policy was installed puts the patch back on the prototype;
            // re-saving that as the original would recurse until the stack overflows
            net.Socket.prototype.connect = patched;
            intercept.install(policy());

            // the unix socket path is a pass through, so this reaches the saved original directly
            dial({ path: '/tmp/newman-hermetic-4.sock' });

            expect(connectCalls).to.have.lengthOf(1);
        });

        it('should reject an invalid policy the same way install() and decode() both validate it', function () {
            var noBlockKey = policy(),
                nonBooleanBlock = policy();

            delete noBlockKey.block;
            nonBooleanBlock.block = 'true';

            // `install()` is the parent process path and never round trips through `decode()`, so it has to
            // enforce the same contract itself
            [
                [undefined, /expected a policy object/],
                [noBlockKey, /block must be a boolean/],
                [nonBooleanBlock, /block must be a boolean/],
                [policy({ 'postman-echo.com': { http: 0 } }), /must be an integer port between 1 and 65535/]
            ].forEach(function (invalidPair) {
                expect(function () { intercept.install(invalidPair[0]); }).to.throw(invalidPair[1]);
                expect(intercept.installed()).to.be.null;
            });
        });

        it('should not install any seam when the policy is rejected', function () {
            var missing = policy();

            delete missing.block;
            delete process.env.NO_PROXY;

            expect(function () {
                intercept.install(missing);
            }).to.throw();

            // a rejected policy must not leave a half installed guard behind
            expect(intercept.installed()).to.be.null;
            expect(net.Socket.prototype.connect).to.equal(originalConnect);
            expect(tls.connect).to.equal(originalTlsConnect);
            expect(process.env.NO_PROXY).to.not.equal('*');
        });

        it('should restore the exact original functions and stop intercepting once uninstalled', function () {
            intercept.install(policy());
            intercept.uninstall();

            expect(net.Socket.prototype.connect).to.equal(originalConnect);
            expect(tls.connect).to.equal(originalTlsConnect);
            expect(intercept.installed()).to.be.null;

            // now prove uninstall actually stops rewriting, not just that it restored some function reference
            stubSocketSeam();
            intercept.install(policy());
            intercept.uninstall();
            dial({ host: 'postman-echo.com', port: 80 });

            expect(forwarded(0)[0].port).to.equal(80);
            expect(forwarded(0)[0].host).to.equal('postman-echo.com');
        });

        it('should set NO_PROXY while installed', function () {
            intercept.install(policy());

            expect(process.env.NO_PROXY).to.equal('*');
        });

        it('should restore whatever NO_PROXY held before, whether set, unset, or empty', function () {
            [
                { before: 'example.com', after: 'example.com' },
                { before: undefined, after: undefined },
                { before: '', after: '' }
            ].forEach(function (variant) {
                if (variant.before === undefined) {
                    delete process.env.NO_PROXY;
                }
                else {
                    process.env.NO_PROXY = variant.before;
                }

                intercept.install(policy());
                expect(process.env.NO_PROXY).to.equal('*');

                intercept.uninstall();

                if (variant.after === undefined) {
                    expect(Object.hasOwn(process.env, 'NO_PROXY')).to.be.false;
                }
                else {
                    expect(process.env.NO_PROXY).to.equal(variant.after);
                }
            });
        });
    });

    describe('encode and decode', function () {
        it('should round trip a policy', function () {
            expect(intercept.decode(intercept.encode(policy()))).to.eql(policy());
        });

        it('should encode without characters that need shell or environment quoting', function () {
            expect(intercept.encode(policy())).to.match(/^[A-Za-z0-9_-]+$/);
        });

        it('should accept an absent hosts map', function () {
            var minimal = policy();

            delete minimal.hosts;

            expect(intercept.decode(intercept.encode(minimal))).to.eql(minimal);
        });

        it('should reject malformed outer input before ever reaching field validation', function () {
            [
                [undefined, /expected a base64url encoded policy string/],
                ['', /expected a base64url encoded policy string/],
                ['not-a-policy', /not decodable base64url JSON/],
                [intercept.encode([1, 2, 3]), /expected a policy object/]
            ].forEach(function (invalidPair) {
                expect(function () { intercept.decode(invalidPair[0]); }).to.throw(invalidPair[1]);
            });
        });

        it('should validate a representative field of every kind decode() enforces', function () {
            var noBlockKey = policy(),
                nonArrayBlackhole = policy(),
                nonObjectHosts = policy(),
                relativeCaPath = policy();

            delete noBlockKey.block;
            nonArrayBlackhole.blackhole = BLACKHOLE_HOST;
            nonObjectHosts.hosts = [];
            relativeCaPath.caFile = path.join('test', 'fixtures', 'ssl', 'ca.crt');

            [
                [noBlockKey, /block must be a boolean/],
                [nonArrayBlackhole, /blackhole must be an array/],
                [nonObjectHosts, /hosts must be an object/],
                [policy({ 'postman-echo.com': { http: 0 } }), /must be an integer port between 1 and 65535/],
                [relativeCaPath, /caFile must be an absolute path/]
            ].forEach(function (invalidPair) {
                expect(function () { intercept.decode(intercept.encode(invalidPair[0])); }).to.throw(invalidPair[1]);
            });
        });
    });
});
