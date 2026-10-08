// The three mutual-TLS servers the `ssl-client-cert` specs run against, each trusting a different CA so that a
// client certificate matching one is rejected by the others. That rejection is the whole assertion surface: a
// request authenticated by the right certificate gets 200, anything else gets 401.
//
// Shared by `test/cli/ssl-client-cert.test.js` and `test/library/ssl-client-cert.test.js`, which both need the
// ephemeral ports the runner bound.

const fs = require('fs'),
    path = require('path'),
    https = require('https'),
    _ = require('lodash'),
    enableServerDestroy = require('server-destroy'),

    SSL_DIR = path.join(__dirname, '..', 'ssl'),

    // The `--ssl-client-cert-list` config. Its `matches` are URL patterns that include the port, and Newman
    // resolves no variables inside this file, so `resolveCertList()` below has to substitute them.
    CERT_LIST_TEMPLATE = path.join(__dirname, '..', 'files', 'ssl-client-cert-config.json'),

    // Each entry pairs a server key/cert with the CA whose client certificates it will accept. `name` is the key
    // published in `ports`, which is what the specs and the collections are keyed on.
    DESCRIPTORS = [
        { name: 'server1', key: 'server.key', cert: 'server.crt', ca: 'ca.crt' },
        { name: 'server2', key: 'server2.key', cert: 'server2.crt', ca: 'ca2.crt' },
        { name: 'server3', key: 'server3.key', cert: 'server3.crt', ca: 'ca3.crt' }
    ],

    PASSPHRASE = 'password',

    // `{ server1, server2, server3 }`, populated before `start`'s callback fires
    ports = {};

var servers = [];

/**
 * Answers 200 when the peer presented a certificate this server's CA vouches for, 401 otherwise.
 *
 * @param {Object} req - the incoming request.
 * @param {Object} res - the response.
 * @returns {*}
 */
function onRequest (req, res) {
    if (req.client.authorized) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });

        return res.end('authorized\n');
    }

    res.writeHead(401, { 'Content-Type': 'text/plain' });

    return res.end('unauthorized\n');
}

/**
 * Builds one mutual-TLS listener. `rejectUnauthorized: false` lets the connection complete even when the client
 * certificate does not verify, so `onRequest` answers 401 rather than the spec seeing a handshake error.
 *
 * @param {Object} descriptor - one entry of `DESCRIPTORS`.
 * @returns {Object} an `https.Server`, not yet listening.
 */
function createServer (descriptor) {
    return https.createServer({
        key: fs.readFileSync(path.join(SSL_DIR, descriptor.key), 'utf8'),
        cert: fs.readFileSync(path.join(SSL_DIR, descriptor.cert), 'utf8'),
        ca: fs.readFileSync(path.join(SSL_DIR, descriptor.ca), 'utf8'),
        passphrase: PASSPHRASE,
        requestCert: true,
        rejectUnauthorized: false
    }, onRequest);
}

/**
 * Starts all three listeners on ephemeral ports, publishing each under its descriptor name in `ports`.
 *
 * @param {Function} callback - `(err)`; `ports` is fully populated before it is invoked.
 * @returns {*}
 */
function start (callback) {
    var pending = DESCRIPTORS.length,
        failed = false;

    /**
     * Invoked once per listener; completes `callback` once all are up, or as soon as any fails.
     *
     * @param {Error} [err] - an error from any listener.
     * @returns {*}
     */
    function done (err) {
        if (failed) {
            return;
        }

        if (err) {
            failed = true;

            return callback(err);
        }

        pending -= 1;

        if (pending === 0) {
            return callback();
        }
    }

    servers = [];

    try {
        DESCRIPTORS.forEach(function (descriptor) {
            var server = createServer(descriptor);

            servers.push(server);
            enableServerDestroy(server);

            server.once('error', done);
            server.listen(0, '127.0.0.1', function () {
                server.removeListener('error', done);
                ports[descriptor.name] = server.address().port;

                done();
            });
        });
    }
    catch (err) {
        // a missing or unreadable key/cert fixture, which `createServer` reads synchronously
        return callback(err);
    }
}

/**
 * Stops every listener that came up. Safe to call when `start` was never called or already failed.
 *
 * @param {Function} callback - `(err)`
 * @returns {*}
 */
function close (callback) {
    var listening = servers.filter(function (server) {
            return server && server.listening;
        }),
        errors = [],
        remaining = listening.length;

    if (!remaining) {
        return callback();
    }

    listening.forEach(function (server) {
        server.destroy(function (err) {
            err && errors.push(err);
            remaining -= 1;

            if (remaining > 0) {
                return;
            }

            if (errors.length) {
                return callback(new Error(_.map(errors, 'message').join('; ')));
            }

            callback();
        });
    });
}

/**
 * The cert-list config with its `{{mtlsServerNPort}}` placeholders replaced by the ports actually bound.
 *
 * Necessary because `--ssl-client-cert-list` is read straight off disk without variable resolution, and
 * `postman-collection` matches a pattern's port exactly - a `*` port would make both entries match both servers and
 * select the wrong certificate.
 *
 * The ports arrive as an argument rather than from `ports` above, because the callers are specs in Mocha workers
 * where this module's own state is empty; `servers.ports()` knows the real values there.
 *
 * @param {Object} vars - variable name to port, as returned by `servers.ports()`.
 * @returns {Array} the resolved cert list, ready to pass as an array or to write to a file.
 */
function resolveCertList (vars) {
    var resolved = fs.readFileSync(CERT_LIST_TEMPLATE, 'utf8');

    Object.keys(vars).forEach(function (name) {
        resolved = resolved.split(`{{${name}}}`).join(vars[name]);
    });

    // an unresolved placeholder becomes the literal port `undefined`, which fails as a certificate mismatch rather
    // than as the plumbing error it is
    if (resolved.includes('{{')) {
        throw new Error('client-cert: unresolved placeholder in the cert list: ' + resolved);
    }

    return JSON.parse(resolved);
}

/**
 * Writes the resolved cert list to `target`, creating its directory, and hands back the path. For the CLI specs,
 * which can only pass `--ssl-client-cert-list` a path.
 *
 * @param {String} target - absolute path to write to.
 * @param {Object} vars - variable name to port, as returned by `servers.ports()`.
 * @returns {String} the same path.
 */
function writeCertList (target, vars) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(resolveCertList(vars), null, 4));

    return target;
}

module.exports = {
    ports,
    start,
    close,
    resolveCertList,
    writeCertList
};
