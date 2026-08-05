const net = require('net'),
    http = require('http'),
    enableServerDestroy = require('server-destroy');

/**
 * Echo raw request message to test
 *  - Body for HTTP methods like GET, HEAD
 *  - Custom HTTP methods
 *
 * @example
 * var s = createRawEchoServer();
 *
 * s.listen(3000, function() {
 *   console.log(s.port);
 *   s.close();
 * });
 *
 * @note For HEAD request, read body from `raw-request` response header
 */
function createRawEchoServer () {
    var server;

    server = net.createServer(function (socket) {
        socket.on('data', function (chunk) {
            if (this.data === undefined) {
                this.data = '';

                setTimeout(() => {
                    // Status Line
                    socket.write('HTTP/1.1 200 ok\r\n');

                    // Response Headers
                    socket.write('connection: close\r\n');
                    socket.write('content-type: text/plain\r\n');
                    socket.write('raw-request: ' + JSON.stringify(this.data) + '\r\n');

                    // CRLF
                    socket.write('\r\n');

                    // Response Body
                    if (!this.data.startsWith('HEAD / HTTP/1.1')) {
                        socket.write(this.data);
                    }

                    socket.end();
                }, 1000);
            }

            this.data += chunk.toString();
        });
    });

    server.on('listening', function () {
        server.port = this.address().port;
    });

    enableServerDestroy(server);

    return server;
}

/**
 * Redirect + Echo Server
 *  - Follows specified redirects -> /<redirects-count>
 *  - Redirects with specified response code -> /status/<response-code>
 *  - Echos final request URL, Method, Headers and Body
 *
 * @example
 * var s = createRedirectServer();
 *
 * s.listen(3000, function() {
 *   console.log(s.port);
 *   s.close();
 * });
 */
function createRedirectServer () {
    var server;

    server = http.createServer(function (req, res) {
        var hops,
            data = '';

        // path: /{n}
        if ((/^\/\d+$/).test(req.url)) {
            hops = parseInt(req.url.substring(1), 10) - 1;

            // redirect until all hops are covered
            res.writeHead(302, {
                location: hops > 0 ? `/${hops}` : '/'
            });

            return res.end();
        }
        // path: /status/<responseCode>
        else if ((/^\/status\/(\d{3})$/).test(req.url)) {
            res.writeHead(parseInt(req.url.substr(-3), 10), { location: '/' });

            return res.end();
        }

        req.on('data', function (d) { data += d; });

        req.once('end', function () {
            res.writeHead(200, { connection: 'close', 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                url: req.url,
                method: req.method,
                headers: req.headers,
                data: data
            }));
        });
    });

    server.on('listening', function () {
        server.port = this.address().port;
    });

    enableServerDestroy(server);

    return server;
}

module.exports = {
    createRawEchoServer,
    createRedirectServer
};
