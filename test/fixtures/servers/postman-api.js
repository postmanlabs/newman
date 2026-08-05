// Local stand-in for `api.getpostman.com` and `api.postman.com`. The tests only reach these through
// `util.fetchJson`, which turns a non-200 carrying `error.name`/`error.message` into the load failure
// `test/library/run-options.test.js` asserts, so the real service's rejected-key payload is the whole contract here.

const RESPONSE_STATUS = 401,

    RESPONSE_BODY = '{"error":{"name":"AuthenticationError","message":"Invalid API Key. ' +
        'Every request requires a valid API Key to be sent."}}';

module.exports = {
    /**
     * Serve one request addressed to a Postman API host, using only the HTTP/1 compatible surface of `res` so the
     * same handler serves both protocols.
     *
     * @param {Object} context - request context built by `echo.js`.
     * @returns {*}
     */
    handle (context) {
        context.res.setHeader('content-type', 'application/json; charset=utf-8');
        context.res.setHeader('content-length', Buffer.byteLength(RESPONSE_BODY));
        context.res.writeHead(RESPONSE_STATUS);

        return context.res.end(RESPONSE_BODY);
    }
};
