const net = require('net');

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
        // wait 1s for data
        // @todo find better way to check data end
        socket.setTimeout(1000);

        socket.on('data', function (chunk) {
            !this.data && (this.data = '');
            this.data += chunk.toString();
        });

        socket.on('timeout', function () {
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
        });
    });

    server.on('listening', function () {
        server.port = this.address().port;
    });

    return server;
}

module.exports = {
    createRawEchoServer
};
