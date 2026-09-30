const net = require('net'),
    enableServerDestroy = require('server-destroy'),

    HEADER_TERMINATOR = '\r\n\r\n',
    LAST_CHUNK = '\r\n0\r\n\r\n',

    CONTENT_LENGTH_REGEXP = /^content-length:[ \t]*(\d+)/im,
    CHUNKED_REGEXP = /^transfer-encoding:[ \t]*chunked/im,

    // published once the server is listening; the fixtures reach this port through `{{rawEchoPort}}`
    ports = {};

var server;

/**
 * Whether everything the client intends to send has arrived. Derived from the request rather than guessed at with a
 * timer: several collections send a body here, and answering before it lands truncates the `raw-request` header they
 * assert on.
 *
 * @param {Buffer} raw - every byte received on the socket so far.
 * @returns {Boolean}
 */
function requestIsComplete (raw) {
    var headerEnd = raw.indexOf(HEADER_TERMINATOR),
        head,
        contentLength;

    if (headerEnd === -1) {
        return false;
    }

    head = raw.subarray(0, headerEnd).toString('latin1');
    contentLength = CONTENT_LENGTH_REGEXP.exec(head);

    if (contentLength) {
        return raw.length - (headerEnd + HEADER_TERMINATOR.length) >= Number(contentLength[1]);
    }

    if (CHUNKED_REGEXP.test(head)) {
        return raw.includes(LAST_CHUNK, headerEnd);
    }

    // neither framing header means there is no body to wait for
    return true;
}

/**
 * Echoes the request back, both as a header and as the response body.
 *
 * @param {Object} socket - the accepted TCP socket.
 * @param {String} raw - the complete request as received.
 * @returns {*}
 */
function respond (socket, raw) {
    socket.write('HTTP/1.1 200 ok\r\n');
    socket.write('connection: close\r\n');
    socket.write('content-type: text/plain\r\n');
    socket.write('raw-request: ' + JSON.stringify(raw) + '\r\n');
    socket.write('\r\n');

    // a HEAD response carries no body, so those fixtures read the request out of `raw-request` instead
    if (!raw.startsWith('HEAD / HTTP/1.1')) {
        socket.write(raw);
    }

    return socket.end();
}

/**
 * Buffers the raw request bytes and echoes them back once the request is complete.
 *
 * Raw TCP rather than `http.createServer`, because the fixtures assert on request forms Node's HTTP parser would
 * normalize or reject - a custom method, and a body on GET or HEAD. The literal bytes come back in a `raw-request`
 * response header, which for a HEAD is the only place a test can read them.
 *
 * Decoding is deferred until every chunk is in, so a multi-byte character split across two TCP segments still
 * round-trips: `whatwg-url.postman_collection.json` sends paths made of astral-plane characters.
 *
 * @param {Object} socket - the accepted TCP socket.
 * @returns {*}
 */
function onConnection (socket) {
    var chunks = [],
        responded = false;

    return socket.on('data', function (chunk) {
        var raw;

        if (responded) {
            return;
        }

        chunks.push(chunk);
        raw = Buffer.concat(chunks);

        if (!requestIsComplete(raw)) {
            return;
        }

        responded = true;

        respond(socket, raw.toString());
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
    server = net.createServer(onConnection);
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
