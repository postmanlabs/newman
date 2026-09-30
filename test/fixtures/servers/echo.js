const http = require('http'),
    http2 = require('http2'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    enableServerDestroy = require('server-destroy'),

    echoHandler = require('./echo-handler'),
    postmanApi = require('./postman-api'),

    KEY_FILE = path.join(__dirname, '..', 'ssl', 'echo.key'),
    CERT_FILE = path.join(__dirname, '..', 'ssl', 'echo.crt'),

    ports = {};

var httpServer,
    http2Server;

/**
 * Strips every HTTP/2 `:` pseudo-header and sets `host` to the given authority.
 *
 * @param {Object} headers - the raw `req.headers` of an HTTP/2 compatibility-API request.
 * @param {String} authority - the request's `:authority`, used as the synthesized `host`.
 * @returns {Object} a plain headers object with no pseudo-headers and `host` set.
 */
function toHttp1Headers (headers, authority) {
    var stripped = {};

    Object.keys(headers).forEach(function (name) {
        if (name.charAt(0) !== ':') {
            stripped[name] = headers[name];
        }
    });

    stripped.host = authority;

    return stripped;
}

/**
 * Builds the protocol-agnostic request context passed to a route handler. Node's HTTP/2 compatibility API already
 * normalizes `method` and `url` identically for both protocols, so only `authority`/`scheme`/`headers` need
 * protocol-specific handling.
 *
 * @param {Object} req - the incoming request (`http.IncomingMessage` or `Http2ServerRequest`).
 * @param {Object} res - the response, written only through the HTTP/1-compatible surface.
 * @returns {Object} the `context` object handed to `echo-handler.js` or `postman-api.js`.
 */
function buildContext (req, res) {
    var authority,
        scheme,
        headers;

    if (req.stream) {
        // RFC 7540 §8.1.2.3 makes `:authority` a SHOULD, and Node does not synthesize it from `Host`. This
        // listener is TLS-only, so `https` is the right default when `:scheme` is absent too.
        authority = req.headers[':authority'] || req.headers.host;
        scheme = req.headers[':scheme'] || 'https';
        headers = toHttp1Headers(req.headers, authority);
    }
    else {
        authority = req.headers.host;
        scheme = req.socket.encrypted ? 'https' : 'http';
        headers = req.headers;
    }

    return {
        method: req.method,
        url: req.url,
        authority: authority,
        scheme: scheme,
        headers: headers,
        req: req,
        res: res
    };
}

/**
 * Dispatches a request context by authority, before path: the two Postman API hosts go to `postman-api.js`,
 * everything else goes to `echo-handler.js`.
 *
 * @param {Object} context - the request context built by `buildContext`.
 * @returns {*}
 */
function dispatch (context) {
    var authority = context.authority ? context.authority.replace(/:\d+$/, '').toLowerCase() : '';

    if (authority === 'api.getpostman.com' || authority === 'api.postman.com') {
        return postmanApi.handle(context);
    }

    return echoHandler.handle(context);
}

/**
 * The shared `request` listener for both the plain HTTP listener and the HTTP/2-over-TLS listener.
 *
 * @param {Object} req - the incoming request.
 * @param {Object} res - the response.
 * @returns {*}
 */
function onRequest (req, res) {
    return dispatch(buildContext(req, res));
}

/**
 * Starts both listeners - a plain HTTP server and an `allowHTTP1`-enabled HTTP/2-over-TLS server - on ephemeral
 * ports.
 *
 * @param {Function} callback - `(err)`; `ports` is fully populated before it is invoked.
 * @returns {*}
 */
function start (callback) {
    var pending = 2,
        failed = false,
        key,
        cert;

    /**
     * Invoked once per listener; completes `callback` once both listeners are up, or as soon as either fails.
     *
     * @param {Error} [err] - an error from either listener.
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

    try {
        key = fs.readFileSync(KEY_FILE);
        cert = fs.readFileSync(CERT_FILE);
    }
    catch (err) {
        return callback(err);
    }

    httpServer = http.createServer(onRequest);
    enableServerDestroy(httpServer);
    httpServer.once('error', done);
    httpServer.listen(0, '127.0.0.1', function () {
        httpServer.removeListener('error', done);
        ports.http = httpServer.address().port;

        done();
    });

    http2Server = http2.createSecureServer({ allowHTTP1: true, key: key, cert: cert }, onRequest);
    enableServerDestroy(http2Server);
    http2Server.once('error', done);
    http2Server.listen(0, '127.0.0.1', function () {
        http2Server.removeListener('error', done);
        ports.https = http2Server.address().port;

        done();
    });
}

/**
 * Stops both listeners; a no-op when `start` was never called or already failed. `server-destroy` covers the HTTP/2
 * listener too, since it destroys the raw socket every session for that connection rides on.
 *
 * @param {Function} callback - `(err)`
 * @returns {*}
 */
function close (callback) {
    var servers = [httpServer, http2Server].filter(function (server) {
            return server && server.listening;
        }),
        errors = [],
        remaining = servers.length;

    if (!remaining) {
        return callback();
    }

    servers.forEach(function (server) {
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

module.exports = {
    ports,
    start,
    close
};
