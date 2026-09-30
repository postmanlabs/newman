/* eslint-disable n/no-process-env */
// Socket level interception for the hermetic test suite. `install(policy)` replaces
// `net.Socket.prototype.connect` and `tls.connect` so that, while a test runner is active:
//
//   - every mapped hostname is served by a local fixture server with only the TCP port rewritten, so the request
//     URL, `Host`, `:authority`, agent options and TLS SNI keep their original values;
//   - the fixture CA is trusted for those mapped hosts only;
//   - a loopback destination is left alone, since a fixture server reached by its published port is already local;
//   - a host on `policy.blackhole` gets a synthetic `ENOTFOUND`, and one on `policy.live` is allowed out untouched;
//   - every other external destination fails with `EHERMETIC` instead of reaching the internet, unless
//     `policy.block` is false, which is the `--live` shape and passes everything through.
//
// Test harness code: nothing under `lib/` or `bin/` knows it exists.

const fs = require('fs'),
    net = require('net'),
    path = require('path'),
    tls = require('tls'),
    util = require('util'),

    LOOPBACK_ADDRESS = '127.0.0.1',
    LOOPBACK_FAMILY = 4,
    LOOPBACK_HOSTNAME = 'localhost',
    LOOPBACK_V4_PREFIX = '127',
    HTTPS_PORT = 443,
    MIN_PORT = 1,
    MAX_PORT = 65535,

    // shared by every policy rejection, since one validation guards both `install()` and the `NEWMAN_TEST_NET` path
    POLICY_ERROR = 'hermetic policy: ',

    NO_PROXY = 'NO_PROXY',
    GETADDRINFO = 'getaddrinfo',
    NOT_FOUND = 'ENOTFOUND',
    BLOCKED = 'EHERMETIC',
    BLOCKED_HINT = ' — external connection blocked; add it to test/fixtures/servers/index.js or serve it locally.',

    // `::1` and every zero padded spelling of it, such as `0:0:0:0:0:0:0:1`. Only tested against valid IPv6 literals.
    IPV6_LOOPBACK = /^[0:]+1$/,

    // the IPv4 mapped IPv6 form, such as `::ffff:127.0.0.1`; the captured quad decides whether it is loopback.
    IPV6_MAPPED_V4 = /^[0:]*:ffff:(\d+\.\d+\.\d+\.\d+)$/i,

    // `net.Socket.prototype.connect` treats its first argument as an already normalized `[options, callback]` array
    // only while that array carries Node's `kNormalizedArgsSymbol`. The symbol is not registered, so the only way to
    // obtain it is to ask Node for a normalized array and read its own symbols back off it.
    NORMALIZED_ARGS_SYMBOLS = Object.getOwnPropertySymbols(net._normalizeArgs([]));

// the installed policy, the functions it replaced, the environment it overwrote, and its lazily read fixture CA
var activePolicy = null,
    caContents = null,
    originalConnect = null,
    originalTlsConnect = null,
    previousNoProxy = null,
    hadNoProxy = false;

// Remove the IPv6 brackets a URL authority carries, turning `[::1]` into `::1`.
function unbracket (host) {
    if (host.length > 2 && host.charAt(0) === '[' && host.charAt(host.length - 1) === ']') {
        return host.slice(1, -1);
    }

    return host;
}

// The host a `connect` call targets, as the caller wrote it. Node defaults an absent host to `localhost`.
function rawHost (options) {
    var host = typeof options.host === 'string' && options.host ? options.host : options.hostname;

    if (typeof host !== 'string' || !host) {
        return LOOPBACK_HOSTNAME;
    }

    return host;
}

// The policy lookup key for a host: unbracketed and lower cased, because the policy is keyed in lower case.
function hostKey (host) {
    return unbracket(host).toLowerCase();
}

// Whether a host stays on this machine: `localhost`, `127.0.0.0/8`, `::1` in any spelling, or IPv4-mapped loopback.
function isLoopback (host) {
    var mapped;

    if (host === LOOPBACK_HOSTNAME) {
        return true;
    }

    if (net.isIPv4(host)) {
        return host.split('.')[0] === LOOPBACK_V4_PREFIX;
    }

    if (!net.isIPv6(host)) {
        return false;
    }

    mapped = IPV6_MAPPED_V4.exec(host);

    if (mapped) {
        return mapped[1].split('.')[0] === LOOPBACK_V4_PREFIX;
    }

    return IPV6_LOOPBACK.test(host);
}

// Whether a host appears in one of the policy's explicit allow lists.
function listed (list, host) {
    return Array.isArray(list) && list.includes(host);
}

// The policy entry for a mapped host, or `null`. An entry without a usable port is not a mapping.
function mappedEntry (host) {
    var entry;

    if (!activePolicy || !activePolicy.hosts || !Object.hasOwn(activePolicy.hosts, host)) {
        return null;
    }

    entry = activePolicy.hosts[host];

    if (!entry || typeof entry !== 'object' || !(entry.http || entry.https)) {
        return null;
    }

    return entry;
}

// The local port a mapped connection belongs on. A `tls.TLSSocket` or the default HTTPS port selects the TLS
// listener, everything else the plaintext one. A host publishing only one always routes there, so a protocol
// mismatch fails locally instead of escaping to the internet.
function mappedPort (socket, options, entry) {
    if (socket instanceof tls.TLSSocket || Number(options.port) === HTTPS_PORT) {
        return entry.https || entry.http;
    }

    return entry.http || entry.https;
}

// Attach the properties Node's own `getaddrinfo` failures carry, so consumers branching on `code` behave the same.
function decorate (error, code, host) {
    error.code = code;
    error.errno = code;
    error.syscall = GETADDRINFO;
    error.hostname = host;

    return error;
}

// The error a blackholed host resolves to, worded as Node's own `ENOTFOUND` so fixtures asserting that text pass.
function notFoundError (host) {
    return decorate(new Error(GETADDRINFO + ' ' + NOT_FOUND + ' ' + host), NOT_FOUND, host);
}

// The error an unmapped external destination fails with. Building it also fails the run, since a blocked connection
// is a suite defect even when the caller swallows the socket error.
function blockedError (host) {
    process.exitCode = 1;

    return decorate(new Error(GETADDRINFO + ' ' + BLOCKED + ' ' + host + BLOCKED_HINT), BLOCKED, host);
}

/**
 * Hand a resolver result back on a later turn of the event loop, as a real resolver would.
 *
 * `setImmediate` rather than `process.nextTick`: `http.ClientRequest` defers its `socket` event with `nextTick`, and
 * `postman-request` attaches the `lookup`/`connect` listeners it derives the DNS phase from inside that handler. A
 * `nextTick` resolver is queued ahead of that deferral and would emit `lookup` before anything was listening.
 *
 * @param {Function} respond - Invokes the resolver callback.
 * @returns {undefined} Nothing.
 */
function deferLookup (respond) {
    setImmediate(respond);
}

// The `lookup` a mapped host resolves through; every fixture server listens on the IPv4 loopback. Node calls it in
// two shapes: `(err, address, family)`, and `(err, addresses)` when it asks for `all` on the `autoSelectFamily`
// path, which is the default for a hostname without an explicit `family`.
function loopbackLookup (host, options, callback) {
    deferLookup(function () {
        if (options && options.all) {
            return callback(null, [{ address: LOOPBACK_ADDRESS, family: LOOPBACK_FAMILY }]);
        }

        return callback(null, LOOPBACK_ADDRESS, LOOPBACK_FAMILY);
    });
}

// A `lookup` that always fails with the supplied error. Failing in the resolver keeps the error on Node's own
// connection error path, so it surfaces asynchronously as a socket `error` and never throws out of `connect`.
function failingLookup (error) {
    return function (host, options, callback) {
        deferLookup(function () {
            return callback(error);
        });
    };
}

// Build the replacement argument array handed to the original `connect`, still recognizable to Node as normalized.
function normalizedArgs (normalized, options) {
    var replacement = [options, normalized[1]];

    // every own symbol has to travel with the clone, otherwise Node re-normalizes the array as an options object
    Object.getOwnPropertySymbols(normalized).forEach(function (symbol) {
        replacement[symbol] = normalized[symbol];
    });

    // a caller supplied bare array carries no symbol at all; mark it so the replacement is still recognized
    NORMALIZED_ARGS_SYMBOLS.forEach(function (symbol) {
        if (replacement[symbol] === undefined) {
            replacement[symbol] = true;
        }
    });

    return replacement;
}

/**
 * Fail a socket the way Node's own connection failure path does, without ever connecting it. Node resolves an IP
 * literal itself and never consults `lookup`, so this is the only seam left for a literal address.
 *
 * `process.nextTick` here, unlike `deferLookup`'s `setImmediate`, matching Node's own `connectErrorNT` timing. With
 * `setImmediate`, `http.ClientRequest` flushes its headers first and the request reports `ERR_SOCKET_CLOSED`.
 *
 * @param {Object} socket - The socket to fail.
 * @param {Error} error - The error to emit.
 * @returns {Object} The same socket, matching `connect`'s return contract.
 */
function failSocket (socket, error) {
    process.nextTick(function () {
        socket.destroy(error);
    });

    return socket;
}

/**
 * The routing and blocking seam, replacing `net.Socket.prototype.connect`. Every documented `connect` form reaches
 * it, including the pre-normalized array `net.createConnection` hands over, which is how an `http.Agent` socket
 * arrives.
 *
 * @this {net.Socket}
 * @returns {Object} The socket, as `connect` always does.
 */
function patchedConnect () {
    var normalized = Array.isArray(arguments[0]) ? arguments[0] : net._normalizeArgs(arguments),

        // an unusable array leaves `options` empty, which routes to the untouched original and lets Node raise the
        // same `ERR_MISSING_ARGS` it would raise without this patch
        options = normalized[0] || {},
        raw,
        host,
        entry;

    if (!activePolicy) {
        return originalConnect.apply(this, arguments);
    }

    // a Unix domain socket never leaves the machine
    if (options.path) {
        return originalConnect.apply(this, arguments);
    }

    raw = rawHost(options);
    host = hostKey(raw);
    entry = mappedEntry(host);

    // a mapped host keeps its `host`/`hostname` and only loses its port; the resolver shim keeps the connection local
    if (entry) {
        return originalConnect.call(this, normalizedArgs(normalized, {
            ...options,
            port: mappedPort(this, options, entry),
            lookup: loopbackLookup
        }));
    }

    if (isLoopback(host)) {
        return originalConnect.apply(this, arguments);
    }

    if (listed(activePolicy.blackhole, host)) {
        return originalConnect.call(this, normalizedArgs(normalized, {
            ...options,
            lookup: failingLookup(notFoundError(raw))
        }));
    }

    // outside block mode, and for the explicit live allow list, the connection happens untouched
    if (!activePolicy.block || listed(activePolicy.live, host)) {
        return originalConnect.apply(this, arguments);
    }

    if (net.isIP(host)) {
        return failSocket(this, blockedError(raw));
    }

    return originalConnect.call(this, normalizedArgs(normalized, {
        ...options,
        lookup: failingLookup(blockedError(raw))
    }));
}

// The fixture CA, read once per installed policy.
function caCertificate () {
    if (caContents === null) {
        caContents = fs.readFileSync(activePolicy.caFile);
    }

    return caContents;
}

// Append the fixture CA to whatever the caller already trusts.
function appendCa (existing) {
    if (!existing) {
        return [caCertificate()];
    }

    if (Array.isArray(existing)) {
        return existing.concat([caCertificate()]);
    }

    return [existing, caCertificate()];
}

// Resolve `tls.connect`'s argument forms the way it does itself, without mutating anything the caller owns: it
// accepts `(options[, callback])` and `(port[, host][, options][, callback])`, merging a trailing options object
// over the port and host it normalized. `options` in the result is always a fresh object.
function normalizeTlsArgs (args) {
    var normalized = net._normalizeArgs(args),
        extra = null;

    if (args[1] !== null && typeof args[1] === 'object') {
        extra = args[1];
    }
    else if (args[2] !== null && typeof args[2] === 'object') {
        extra = args[2];
    }

    return [{ ...normalized[0], ...extra }, normalized[1]];
}

/**
 * The trust seam and nothing else: for a mapped host it appends the fixture CA and pins SNI to the original
 * hostname, leaving `port`/`host`/`lookup` to the socket seam above. An unmapped host, including the live
 * `expired.badssl.com`, passes through untouched so it still validates against the real world.
 *
 * NOTE: an injected `ca` is honoured only while the caller supplies no `secureContext`, which shadows `ca` entirely.
 * `postman-request` builds one only under `--ssl-extra-ca-certs`, whose single consumer targets `localhost`. A test
 * combining that flag with a mapped host has to extend this seam to merge the CA into the supplied `secureContext`.
 *
 * @returns {Object} Whatever the original `tls.connect` returns.
 */
function patchedTlsConnect () {
    var normalized,
        options,
        callback,
        raw,
        clone;

    if (!activePolicy) {
        return originalTlsConnect.apply(tls, arguments);
    }

    normalized = normalizeTlsArgs(arguments);
    options = normalized[0];
    callback = normalized[1];
    raw = rawHost(options);

    if (options.path || !mappedEntry(hostKey(raw))) {
        return originalTlsConnect.apply(tls, arguments);
    }

    clone = { ...options, ca: appendCa(options.ca) };

    // Node rejects an IP literal as a server name; a mapped host is always a hostname, but check anyway
    if (!clone.servername && !net.isIP(hostKey(raw))) {
        clone.servername = raw;
    }

    if (callback) {
        return originalTlsConnect.call(tls, clone, callback);
    }

    return originalTlsConnect.call(tls, clone);
}

// Whether a value is usable as a TCP port number.
function isPort (value) {
    return Number.isInteger(value) && value >= MIN_PORT && value <= MAX_PORT;
}

// Validate the `hosts` map of a policy; throws on the first problem it finds.
function validateHosts (hosts) {
    var names,
        entry,
        protocols,
        i,
        j;

    if (!hosts || typeof hosts !== 'object' || Array.isArray(hosts)) {
        throw new Error(POLICY_ERROR + 'hosts must be an object.');
    }

    names = Object.keys(hosts);

    for (i = 0; i < names.length; i++) {
        entry = hosts[names[i]];

        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new Error(POLICY_ERROR + 'hosts["' + names[i] + '"] must be an object.');
        }

        protocols = Object.keys(entry);

        for (j = 0; j < protocols.length; j++) {
            if (!isPort(entry[protocols[j]])) {
                throw new Error(POLICY_ERROR + 'hosts["' + names[i] + '"].' + protocols[j] +
                    ' must be an integer port between ' + MIN_PORT + ' and ' + MAX_PORT + '.');
            }
        }
    }
}

// Validate the `caFile` of a policy; throws when the path is unusable.
function validateCaFile (caFile) {
    if (typeof caFile !== 'string' || !caFile || !path.isAbsolute(caFile)) {
        throw new Error(POLICY_ERROR + 'caFile must be an absolute path.');
    }

    try {
        fs.accessSync(caFile, fs.constants.R_OK);
    }
    catch (error) {
        throw new Error(POLICY_ERROR + 'caFile is not readable: ' + caFile, { cause: error });
    }
}

/**
 * Validate a policy object, whoever produced it. `decode()` only covers the child process path, so validating there
 * alone would leave the parent, which calls `install()` directly, unchecked.
 *
 * @param {*} policy - The candidate policy.
 * @returns {undefined} Nothing; throws on the first problem it finds.
 */
function validate (policy) {
    if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
        throw new Error(POLICY_ERROR + 'expected a policy object.');
    }

    // required rather than defaulted: `JSON.stringify` drops an `undefined`, so an omitted `block` encodes as a
    // well formed looking policy that lets every external connection through
    if (typeof policy.block !== 'boolean') {
        throw new Error(POLICY_ERROR + 'block must be a boolean, got ' + JSON.stringify(policy.block) + '.');
    }

    if (policy.blackhole !== undefined && !Array.isArray(policy.blackhole)) {
        throw new Error(POLICY_ERROR + 'blackhole must be an array.');
    }

    if (policy.live !== undefined && !Array.isArray(policy.live)) {
        throw new Error(POLICY_ERROR + 'live must be an array.');
    }

    validateHosts(policy.hosts === undefined ? {} : policy.hosts);
    validateCaFile(policy.caFile);
}

/**
 * Serialize a policy for `NEWMAN_TEST_NET`. Base64url keeps the value free of characters a shell or the Windows
 * environment block would quote differently.
 *
 * @param {Object} policy - The policy object.
 * @returns {String} Base64url encoded JSON.
 */
function encode (policy) {
    return Buffer.from(JSON.stringify(policy)).toString('base64url');
}

/**
 * Decode and validate a `NEWMAN_TEST_NET` value.
 *
 * @param {String} encoded - Base64url encoded JSON.
 * @returns {Object} The validated policy object.
 */
function decode (encoded) {
    var policy;

    if (typeof encoded !== 'string' || !encoded) {
        throw new Error('NEWMAN_TEST_NET: expected a base64url encoded policy string.');
    }

    try {
        policy = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    }
    catch (error) {
        throw new Error('NEWMAN_TEST_NET: policy is not decodable base64url JSON.', { cause: error });
    }

    validate(policy);

    return policy;
}

/**
 * Install the interception seams. The policy is validated here as well as in `decode()`, so an in-process caller is
 * held to the same contract as an encoded one.
 *
 * Installing twice with a deep equal policy is a no-op; installing over a different policy is a programming error,
 * since the two would disagree about where a host lives.
 *
 * @param {Object} policy - The policy object.
 * @returns {undefined} Nothing.
 */
function install (policy) {
    // validate before touching anything, so a rejected policy cannot leave a half installed seam behind
    validate(policy);

    if (activePolicy) {
        if (util.isDeepStrictEqual(activePolicy, policy)) {
            return;
        }

        throw new Error('intercept: already installed with a different policy, uninstall() first.');
    }

    activePolicy = policy;
    caContents = null;

    // Never save our own patch as the "original". A test that snapshots `connect` while a policy is installed and
    // restores it after `uninstall()` puts the patch back on the prototype, and saving that would make the seam call
    // itself until the stack overflows. The previously saved original is still the right one.
    originalConnect = net.Socket.prototype.connect === patchedConnect ?
        originalConnect : net.Socket.prototype.connect;
    originalTlsConnect = tls.connect === patchedTlsConnect ? originalTlsConnect : tls.connect;

    hadNoProxy = Object.hasOwn(process.env, NO_PROXY);
    previousNoProxy = hadNoProxy ? process.env[NO_PROXY] : null;

    net.Socket.prototype.connect = patchedConnect;
    tls.connect = patchedTlsConnect;

    // bypass any ambient proxy configuration `postman-request` would otherwise honour
    process.env[NO_PROXY] = '*';
}

// Remove the interception seams, restoring the exact functions and `NO_PROXY` state they replaced.
function uninstall () {
    if (!activePolicy) {
        return;
    }

    net.Socket.prototype.connect = originalConnect;
    tls.connect = originalTlsConnect;

    if (hadNoProxy) {
        process.env[NO_PROXY] = previousNoProxy;
    }
    else {
        delete process.env[NO_PROXY];
    }

    activePolicy = null;
    caContents = null;
    previousNoProxy = null;
    hadNoProxy = false;
}

// The policy that is currently installed, or `null`.
function installed () {
    return activePolicy;
}

module.exports = { install, uninstall, installed, encode, decode, BLOCKED_HINT };
