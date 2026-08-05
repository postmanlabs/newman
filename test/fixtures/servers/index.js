/* eslint-disable n/no-process-env */
const path = require('path'),

    async = require('async'),
    _ = require('lodash'),

    rawEcho = require('./raw-echo'),
    redirect = require('./redirect'),
    echo = require('./echo'),
    clientCert = require('./client-cert'),

    SERVERS = [rawEcho, redirect, echo, clientCert],

    BLACKHOLE = ['123.random.z'],
    LIVE = ['expired.badssl.com'],

    CA_FILE = path.join(__dirname, '..', 'ssl', 'ca.crt'),
    PRELOAD = path.join(__dirname, 'preload.js'),

    // how the bound ports reach a Mocha worker or a spawned child; written by `runner.js`, read by `ports()`
    PORTS_ENV = 'NEWMAN_TEST_PORTS',

    // The `--require` fragment for handing `preload.js` to a child through `NODE_OPTIONS`. The quotes keep a
    // checkout path containing a space as one token, and Node unescapes a backslash inside a quoted token
    // (`ParseNodeOptionsEnvVar` in `node_options.cc`), so a Windows path's separators have to be doubled or the
    // child receives `D:anewman...`. `PRELOAD` stays the bare path, which is what Mocha's `require` option wants.
    PRELOAD_REQUIRE = `--require "${PRELOAD.replace(/\\/g, '\\\\')}"`;

var started = [];

/**
 * Starts every fixture server, sequentially, stopping at the first error. There is no server-selection mode: every
 * server binds an ephemeral port, so starting all of them costs nothing and cannot collide with another suite.
 *
 * @param {Function} callback - `(err)`
 * @returns {*}
 */
function start (callback) {
    // `started` is what `close` walks, so a second start without an intervening close would strand the first batch
    if (started.length) {
        return callback(new Error('fixture servers: already started, close() first.'));
    }

    return async.eachSeries(SERVERS, function (server, next) {
        started.push(server);

        server.start(next);
    }, callback);
}

/**
 * Closes every fixture server that was started, tolerating servers that never started or already failed to start.
 * Errors from individual servers are aggregated onto one Error rather than discarded.
 *
 * @param {Function} callback - `(err)`
 * @returns {*}
 */
function close (callback) {
    var servers = started,
        errors = [];

    started = [];

    async.each(servers, function (server, next) {
        server.close(function (err) {
            err && errors.push(err);

            next();
        });
    }, function () {
        var aggregate;

        if (!errors.length) {
            return callback();
        }

        aggregate = new Error(_.map(errors, 'message').join('; '));
        aggregate.errors = errors;

        callback(aggregate);
    });
}

/**
 * Builds the network policy from the ports the fixture servers actually bound, so it must be called after `start`.
 *
 * `hosts` is gated on `block` rather than on which servers are running, because every server starts in every mode:
 * reading `echo.ports` unconditionally would map `postman-echo.com` locally during a `--live` run too.
 *
 * @param {Object} options - `{ block: Boolean }`
 * @returns {Object}
 */
function policy (options) {
    return {
        block: options.block,
        blackhole: BLACKHOLE.slice(),
        live: LIVE.slice(),
        hosts: options.block ? {
            'postman-echo.com': { http: echo.ports.http, https: echo.ports.https },
            'httpbin.org': { http: echo.ports.http, https: echo.ports.https },
            'api.getpostman.com': { https: echo.ports.https },
            'api.postman.com': { https: echo.ports.https }
        } : {},
        caFile: CA_FILE
    };
}

/**
 * The ports every fixture server bound, as collection variables. Handed to `newman.run` as `envVar` by the
 * integration runner, and read by the specs that drive the client-certificate servers.
 *
 * A Mocha worker, and any spawned child, has its own instance of these modules in which the servers never started
 * and every `ports` object is empty. `runner.js` publishes the real values through `PORTS_ENV`, and that copy wins
 * whenever it is present.
 *
 * @returns {Object} variable name to port.
 */
function ports () {
    if (process.env[PORTS_ENV]) {
        return JSON.parse(process.env[PORTS_ENV]);
    }

    return {
        rawEchoPort: rawEcho.ports.http,
        redirectPort: redirect.ports.http,
        mtlsServer1Port: clientCert.ports.server1,
        mtlsServer2Port: clientCert.ports.server2,
        mtlsServer3Port: clientCert.ports.server3
    };
}

module.exports = {
    start,
    close,
    policy,
    ports,
    PORTS_ENV,
    PRELOAD,
    PRELOAD_REQUIRE
};
