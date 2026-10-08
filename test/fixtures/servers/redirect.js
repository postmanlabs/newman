const http = require('http'),
    enableServerDestroy = require('server-destroy'),

    HOPS_PATH_REGEXP = /^\/(\d+)$/,
    STATUS_PATH_REGEXP = /^\/status\/(\d{3})$/,

    // published once the server is listening; the fixtures reach this port through `{{redirectPort}}`
    ports = {};

var server;

/**
 * Follows `/<n>` redirect chains, redirects with a chosen code via `/status/<code>`, and otherwise echoes the final
 * request's URL, method, headers and body. Drives the protocol-profile-behavior fixtures.
 *
 * @param {Object} req - the incoming request.
 * @param {Object} res - the response.
 * @returns {*}
 */
function onRequest (req, res) {
    var hops = HOPS_PATH_REGEXP.exec(req.url),
        status = STATUS_PATH_REGEXP.exec(req.url),
        remaining,
        data = '';

    // path: /{n}
    if (hops) {
        remaining = Number(hops[1]) - 1;

        // redirect until all hops are covered. `location` stays relative, so the port never appears in it.
        res.writeHead(302, {
            location: remaining > 0 ? `/${remaining}` : '/'
        });

        return res.end();
    }

    // path: /status/<responseCode>
    if (status) {
        res.writeHead(Number(status[1]), { location: '/' });

        return res.end();
    }

    req.on('data', function (d) { data += d; });

    return req.once('end', function () {
        res.writeHead(200, { connection: 'close', 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            url: req.url,
            method: req.method,
            headers: req.headers,
            data: data
        }));
    });
}

/**
 * Starts the server on an ephemeral port and publishes it. Bound to `127.0.0.1` explicitly, so nothing depends on
 * whether `localhost` resolves to `::1` on the host running the suite.
 *
 * @param {Function} callback - `(err)`; `ports` is populated before it is invoked.
 * @returns {*}
 */
function start (callback) {
    server = http.createServer(onRequest);
    enableServerDestroy(server);

    server.once('error', callback);

    server.listen(0, '127.0.0.1', function () {
        server.removeListener('error', callback);
        ports.http = server.address().port;

        callback();
    });
}

/**
 * Stops the server. Safe to call when `start` was never called or already failed.
 *
 * @param {Function} callback - `(err)`
 * @returns {*}
 */
function close (callback) {
    if (!server || !server.listening) {
        return callback();
    }

    server.destroy(callback);
}

module.exports = {
    ports,
    start,
    close
};
