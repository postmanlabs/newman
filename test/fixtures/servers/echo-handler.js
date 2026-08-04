// Pure route handler for the local Postman Echo fixture server.
//
// The handler is protocol agnostic: it responds only through the HTTP/1 compatible surface of `res`, so `echo.js`
// serves it over both HTTP/1 and HTTP/2, and it must never touch an HTTP/2-only API. There is no external
// passthrough in any mode; an unimplemented route answers 501 rather than making a silent public request.

const zlib = require('zlib'),
    crypto = require('crypto'),
    Hawk = require('hawk'),

    cachedFiles = require('./cached-files'),

    JSON_TYPE = 'application/json; charset=utf-8',
    HTML_TYPE = 'text/html; charset=utf-8',

    COLON = ':',
    AUTH = 'auth',
    AUTH_INT = 'auth-int',
    MD5_SESS = 'MD5-sess',
    CRLF = '\r\n',
    CR = 0x0d,
    LF = 0x0a,

    OAUTH_SIGNATURE = 'oauth_signature',
    OAUTH_REALM = 'realm',
    OAUTH_KEY = 'D+EdQ-gs$-%@2Nu7',

    BASIC_AUTH_USERNAME = 'postman',
    BASIC_AUTH_PASSWORD = 'password',
    DIGEST_AUTH_USERNAME = 'postman',
    DIGEST_AUTH_PASSWORD = 'password',
    DIGEST_AUTH_REALM = 'Users',

    HAWK_AUTH_ID = 'dh37fgj492je',
    HAWK_AUTH_KEY = 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
    HAWK_AUTH_ALGORITHM = 'sha256',
    HAWK_AUTH_USER = 'Postman',

    // eslint-disable-next-line max-len
    OAUTH2_ACCESS_TOKEN = 'vp7jxTwqgczoFHs0uIdOvv4VdBWmvCkbVbNBCuaTQ3JZplPS40BaNV47HD1zt7MztQPILJvqYsOs6PfJpFYBgwbaE3CVEKOj',
    OAUTH2_USER_ID = '631643',
    OAUTH2_USER_NAME = 'Postman',

    // Emitted by every `/cookies*` response. On `/cookies/set` it is appended *after* the requested cookies, so
    // those are created first: `cookie-jar.test.js` asserts the exported jar starts with `foo=bar;`, and
    // tough-cookie orders same-path cookies by creation time.
    SAILS_SESSION_COOKIE = 'sails.sid=0123456789; Path=/; HttpOnly',

    DOCUMENTATION_URL = 'https://www.getpostman.com/docs/postman_echo',

    // Hardcoded rather than read from the part's own `Content-Type`: `tc4` asserts
    // `data:application/octet-stream;base64,` on `upload-file.json`, whose part declares `application/json`.
    DATA_URI_PREFIX = 'data:application/octet-stream;base64,',

    // Paths that answer 404 rather than the generic 501. `/get.` is not `/get`: the trailing dot must not be
    // normalized away, and the public service answers 404 for it.
    NOT_FOUND_PATHS = ['/get.'],

    STATUS_PATH_REGEXP = /^\/status\/([1-5][0-9][0-9])$/,
    STREAM_PATH_REGEXP = /^\/stream\/([0-9]+)$/,
    DELAY_PATH_REGEXP = /^\/delay\/([0-9]+)$/,
    TYPE_PATH_REGEXP = /^\/type\/(html|xml)$/,
    BOUNDARY_REGEXP = /boundary=(?:"([^"]+)"|([^;]+))/i,
    DISPOSITION_NAME_REGEXP = /[\s;]name="([^"]*)"/i,
    DISPOSITION_FILENAME_REGEXP = /filename="([^"]*)"/i;

// Hex encoded MD5 digest, the only hash the digest-auth endpoint supports.
function md5Hex (input) {
    return crypto.createHash('md5').update(String(input)).digest('hex');
}

// Base64 encoded HMAC-SHA1, used by the OAuth 1.0a signature check.
function hmacSha1Base64 (input, key) {
    return crypto.createHmac('sha1', key).update(input).digest('base64');
}

// Percent-decode a value, falling back to the raw value when it is malformed.
function decodeSafe (value) {
    try {
        return decodeURIComponent(value);
    }
    catch (e) {
        return value;
    }
}

// Normalize a content type the way the public `/response-headers` endpoint does: collapse the whitespace run after
// `;` to a single space and append `; charset=utf-8` when no charset was requested. `semicolon-tests` sends
// `application/json;  charset=utf-8` and expects one space; `echo-v2` sends `text/html` and expects the charset.
function normalizeContentType (value) {
    const normalized = String(value).replace(/;\s+/g, '; ');

    if ((/charset=/i).test(normalized)) {
        return normalized;
    }

    return normalized + '; charset=utf-8';
}

// Add a value to a parameter map, collapsing repeats into an array so `?hi=a&hi=b` echoes a two element array.
function addValue (target, key, value) {
    if (!Object.hasOwn(target, key)) {
        target[key] = value;

        return;
    }

    target[key] = Array.isArray(target[key]) ? [...target[key], value] : [target[key], value];
}

// Parse the query component of a raw request target. Only the substring after the first `?` is parsed, so the
// duplicated `?` and empty query members `whatwg-url` sends survive untouched in the echoed `url`.
function parseQuery (url) {
    const index = String(url).indexOf('?'),
        result = {};

    if (index === -1) {
        return result;
    }

    new URLSearchParams(String(url).slice(index + 1)).forEach(function (value, key) {
        addValue(result, key, value);
    });

    return result;
}

// Parse a request `Cookie` header into a name/value map.
function parseCookieHeader (header) {
    const cookies = {};

    String(header || '').split(';').forEach(function (pair) {
        const index = pair.indexOf('='),
            key = (index === -1 ? pair : pair.slice(0, index)).trim();

        if (!key) {
            return;
        }

        cookies[key] = index === -1 ? '' : decodeSafe(pair.slice(index + 1).trim());
    });

    return cookies;
}

// Parse an `Authorization` parameter list into a map, stripping double quotes but leaving percent-encoding intact.
function authInfoParser (data) {
    const result = {};

    String(data).split(',').forEach(function (entry) {
        const index = entry.indexOf('='),
            key = index === -1 ? '' : entry.slice(0, index).trim();

        if (!key) {
            return;
        }

        result[key] = entry.slice(index + 1).replace(/"/g, '');
    });

    return result;
}

// Split a buffer on every occurrence of a delimiter.
function splitBuffer (buffer, delimiter) {
    const parts = [];
    let start = 0,
        index = buffer.indexOf(delimiter);

    while (index !== -1) {
        parts.push(buffer.subarray(start, index));
        start = index + delimiter.length;
        index = buffer.indexOf(delimiter, start);
    }

    parts.push(buffer.subarray(start));

    return parts;
}

// Strip one leading and one trailing CRLF from a multipart section.
function trimCrlf (buffer) {
    const start = buffer.length > 1 && buffer[0] === CR && buffer[1] === LF ? 2 : 0,
        end = buffer.length - start > 1 &&
            buffer[buffer.length - 2] === CR &&
            buffer[buffer.length - 1] === LF ? buffer.length - 2 : buffer.length;

    return buffer.subarray(start, end);
}

// Split one multipart section into its disposition metadata and raw content, or `null` when it is not a form field.
function parseMultipartPart (part) {
    const separator = Buffer.from(CRLF + CRLF),
        index = part.indexOf(separator),
        rawHeaders = index === -1 ? '' : part.subarray(0, index).toString('utf8'),
        name = DISPOSITION_NAME_REGEXP.exec(rawHeaders),
        filename = DISPOSITION_FILENAME_REGEXP.exec(rawHeaders);

    if (index === -1 || !name) {
        return null;
    }

    return {
        name: name[1],
        filename: filename ? filename[1] : null,
        content: part.subarray(index + separator.length)
    };
}

// Parse a `multipart/form-data` body into the Echo `form` and `files` maps. Uploaded files are keyed on filename
// and carry a base64 data URI value, which is what `tc4.postman_collection.json` asserts.
function parseMultipartBody (body, boundary) {
    const result = { form: {}, files: {} };

    splitBuffer(body, Buffer.from('--' + boundary)).forEach(function (section) {
        const part = trimCrlf(section),
            parsed = part.length ? parseMultipartPart(part) : null;

        if (!parsed) {
            return;
        }

        if (parsed.filename) {
            result.files[parsed.filename] = DATA_URI_PREFIX + parsed.content.toString('base64');

            return;
        }

        addValue(result.form, parsed.name, parsed.content.toString('utf8'));
    });

    return result;
}

// Parse an `application/x-www-form-urlencoded` body into the Echo `form` map.
function parseUrlEncodedBody (body) {
    const result = { form: {}, files: {} };

    new URLSearchParams(body.toString('utf8')).forEach(function (value, key) {
        addValue(result.form, key, value);
    });

    return result;
}

// Collapse consecutive slashes in the path, leaving the query byte for byte unchanged. An empty leading path
// segment makes Newman send `//get`, which the public service normalizes. The query is deliberately excluded:
// `whatwg-url` asserts duplicate question marks and empty query members survive, so nothing after the first `?`
// may ever be rewritten.
function normalizeTarget (url) {
    const raw = String(url),
        index = raw.indexOf('?');

    if (index === -1) {
        return raw.replace(/\/{2,}/g, '/');
    }

    return raw.slice(0, index).replace(/\/{2,}/g, '/') + raw.slice(index);
}

// The path a request routes on: the normalized path with the query removed.
function requestPath (url) {
    return String(url).split('?')[0].replace(/\/{2,}/g, '/');
}

// Build the echoed request URL by raw string concatenation. Never use `new URL` here: `whatwg-url` asserts that
// duplicate question marks, empty query members, pre-encoded values and stripped userinfo all reach the response
// byte for byte as sent. Only the path is normalized, by `normalizeTarget`.
function rawUrl (context) {
    return context.scheme + '://' + context.authority + normalizeTarget(context.url);
}

// Write a complete response through the HTTP/1 compatible surface; array header values emit repeats.
function send (context, status, body, headers) {
    const res = context.res,
        names = Object.keys(headers || {});

    names.forEach(function (name) {
        res.setHeader(name, headers[name]);
    });

    res.writeHead(status);

    return res.end(body);
}

// Write a JSON response.
function sendJson (context, status, payload, headers) {
    return send(context, status, JSON.stringify(payload), { 'content-type': JSON_TYPE, ...headers });
}

// Build the full echo payload for a body carrying request method.
function buildEchoPayload (context, body) {
    const headers = context.headers || {},
        contentType = typeof headers['content-type'] === 'string' ? headers['content-type'] : '',
        boundary = contentType.includes('multipart/form-data') ? BOUNDARY_REGEXP.exec(contentType) : null,
        parsed = boundary ?
            parseMultipartBody(body, boundary[1] || boundary[2]) :
            contentType.startsWith('application/x-www-form-urlencoded') && parseUrlEncodedBody(body),
        payload = {
            args: parseQuery(context.url),
            data: {},
            files: parsed ? parsed.files : {},
            form: parsed ? parsed.form : {},
            headers: headers,
            json: null,
            url: rawUrl(context)
        };

    if (parsed) {
        return payload;
    }

    payload.data = body.toString('utf8');

    if (contentType.startsWith('application/json')) {
        try {
            payload.json = JSON.parse(payload.data);
            payload.data = payload.json;
        }
        catch (e) {
            payload.json = null;
        }
    }

    return payload;
}

// Build the `Set-Cookie` header list for every requested cookie.
function buildSetCookies (queries, valueBuilder) {
    const headers = [];

    Object.keys(queries).forEach(function (key) {
        const value = queries[key];

        if (!Array.isArray(value)) {
            headers.push(valueBuilder(key, value));

            return;
        }

        value.forEach(function (item) {
            headers.push(valueBuilder(key, item));
        });
    });

    return headers;
}

// Build a digest-auth challenge. `realm` and `nonce` must stay double quoted: `echo-v2` extracts both by scanning
// for the first `"` after each, and postman-runtime's own extractor uses `/realm="([^"]*)"/`.
function digestChallenge () {
    return 'Digest realm="' + DIGEST_AUTH_REALM + '", qop="auth", nonce="' +
        crypto.randomBytes(16).toString('hex') + '"';
}

// Compute the RFC 2617 `response` digest, supporting MD5 and MD5-sess with and without `auth`/`auth-int`.
//
// Realm and nonce come from whatever the client presented; no issued nonce is tracked. `super-sandbox-test` sends a
// hardcoded nonce and never performs a challenge round-trip, so a handler that remembers its own nonces 401s there.
function digestResponse (method, info, body) {
    const realm = info.realm || DIGEST_AUTH_REALM,
        secret = info.username + COLON + realm + COLON + DIGEST_AUTH_PASSWORD,
        a1 = info.algorithm === MD5_SESS ?
            md5Hex(secret) + COLON + info.nonce + COLON + info.cnonce :
            secret,
        a2 = info.qop === AUTH_INT ?
            method + COLON + info.uri + COLON + md5Hex(body.toString('utf8')) :
            method + COLON + info.uri,
        hashA1 = md5Hex(a1),
        hashA2 = md5Hex(a2);

    if (info.qop === AUTH || info.qop === AUTH_INT) {
        return md5Hex([hashA1, info.nonce, info.nc, info.cnonce, info.qop, hashA2].join(COLON));
    }

    return md5Hex([hashA1, info.nonce, hashA2].join(COLON));
}

// Hawk credentials lookup, keyed on the id the fixtures sign with.
function hawkCredentials (id) {
    if (id !== HAWK_AUTH_ID) {
        return null;
    }

    return { key: HAWK_AUTH_KEY, algorithm: HAWK_AUTH_ALGORITHM, user: HAWK_AUTH_USER };
}

// Build the `Server-Authorization` header for a failed Hawk authentication.
function hawkServerHeader (error) {
    if (!(error && error.credentials && error.artifacts)) {
        return '';
    }

    try {
        return Hawk.server.header(error.credentials, error.artifacts);
    }
    catch (e) {
        return '';
    }
}

// Route handlers. Each takes the handler context built by `echo.js`, and those that need a body take the buffered
// request body as a second argument.

// `GET /get` — echo the raw URL, parsed args, request headers and method.
function routeGet (context) {
    return sendJson(context, 200, {
        args: parseQuery(context.url),
        headers: context.headers,
        method: context.method,
        url: rawUrl(context)
    });
}

// `GET /headers` — echo the request headers and nothing else.
//
// This response must not carry a `url` key: `set-next-request.postman_collection.json` terminates on
// `!jsonData.url && jsonData.headers`, so adding one leaves it looping.
function routeHeaders (context) {
    return sendJson(context, 200, { headers: context.headers });
}

// `/post`, `/put`, `/patch`, `/delete` — echo the request with its unparsed body as `data`, plus `form` and `files`.
function routeEchoBody (context, body) {
    return sendJson(context, 200, buildEchoPayload(context, body));
}

// `/type/html`, `/type/xml` — the exact cached bodies.
function routeType (context, type) {
    return send(context, 200, cachedFiles[type], {
        'content-type': 'application/' + type + '; charset=utf-8'
    });
}

// `/status/:code` — answer with the requested status code.
function routeStatus (context, code) {
    return sendJson(context, code, { status: code });
}

// `/redirect-to` — redirect to the decoded `url` query value.
function routeRedirectTo (context) {
    const requested = parseQuery(context.url).url,
        target = Array.isArray(requested) ? requested[0] : requested;

    if (!target) {
        return sendJson(context, 400, { error: 'a `url` query parameter is required' });
    }

    return send(context, 302, 'Found. Redirecting to ' + target, {
        'content-type': HTML_TYPE,
        location: target
    });
}

// `/cookies` — echo the cookies the request presented.
function routeCookies (context) {
    return sendJson(context, 200, {
        cookies: parseCookieHeader((context.headers || {}).cookie)
    }, {
        'set-cookie': [SAILS_SESSION_COOKIE]
    });
}

// `/cookies/set` — set every requested cookie, then redirect to `/cookies`.
function routeCookiesSet (context) {
    const cookies = buildSetCookies(parseQuery(context.url), function (key, value) {
        return key + '=' + value + '; Path=/';
    });

    cookies.push(SAILS_SESSION_COOKIE);

    return send(context, 302, 'Found. Redirecting to /cookies', {
        'content-type': HTML_TYPE,
        location: '/cookies',
        'set-cookie': cookies
    });
}

// `/cookies/delete` — expire every requested cookie, then redirect to `/cookies`.
function routeCookiesDelete (context) {
    const cookies = buildSetCookies(parseQuery(context.url), function (key) {
        return key + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });

    cookies.push(SAILS_SESSION_COOKIE);

    return send(context, 302, 'Found. Redirecting to /cookies', {
        'content-type': HTML_TYPE,
        location: '/cookies',
        'set-cookie': cookies
    });
}

// `/response-headers` — set every query parameter as a response header verbatim, including non content-type ones
// such as `Server`. The body repeats the requested map exactly as it was sent.
function routeResponseHeaders (context) {
    const queries = parseQuery(context.url),
        headers = {};

    Object.keys(queries).forEach(function (name) {
        headers[name] = name.toLowerCase() === 'content-type' ?
            normalizeContentType(queries[name]) :
            queries[name];
    });

    return send(context, 200, JSON.stringify(queries, null, 4), headers);
}

// `/gzip`, `/deflate` — compress the echo JSON with the declared encoding.
function routeCompressed (context, encoding) {
    const isGzip = encoding === 'gzip',
        payload = {
            [isGzip ? 'gzipped' : 'deflated']: true,
            headers: context.headers,
            method: context.method
        },
        raw = Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
        body = isGzip ? zlib.gzipSync(raw) : zlib.deflateSync(raw);

    return send(context, 200, body, {
        'content-encoding': encoding,
        'content-type': JSON_TYPE
    });
}

// `/encoding/utf8` — the exact cached UTF-8 fixture text.
function routeEncodingUtf8 (context) {
    return send(context, 200, cachedFiles.utf8Text, { 'content-type': HTML_TYPE });
}

// `/delay/:n` — answer after a real `n` second delay, which is what the `--timeout-request` and script timeout
// fixtures measure. Do not shorten it to speed up the suite.
function routeDelay (context, seconds) {
    return setTimeout(function () {
        sendJson(context, 200, { delay: seconds });
    }, Number(seconds) * 1000);
}

// `/stream/:n` — emit `n` newline-terminated JSON records and close. Without the separator the records run together
// into a `}{` boundary no streaming consumer can split.
function routeStream (context, count) {
    const record = JSON.stringify({
        args: parseQuery(context.url),
        headers: context.headers,
        url: rawUrl(context)
    }, null, 2) + '\n';

    context.res.setHeader('content-type', JSON_TYPE);
    context.res.writeHead(200);

    for (let index = 0; index < count; index++) {
        context.res.write(record);
    }

    return context.res.end();
}

// `/basic-auth` — require `postman` / `password`.
function routeBasicAuth (context) {
    const presented = String((context.headers || {}).authorization || '').replace(/^Basic /i, ''),
        expected = Buffer.from(BASIC_AUTH_USERNAME + COLON + BASIC_AUTH_PASSWORD).toString('base64');

    if (presented && presented === expected) {
        return sendJson(context, 200, { authenticated: true });
    }

    return send(context, 401, 'Unauthorized', { 'content-type': HTML_TYPE });
}

// `/digest-auth` — verify MD5 and MD5-sess digests, challenging otherwise.
function routeDigestAuth (context, body) {
    const presented = String((context.headers || {}).authorization || ''),
        info = authInfoParser(presented.replace(/^Digest /i, '')),
        verified = Boolean(presented) &&
            info.username === DIGEST_AUTH_USERNAME &&
            digestResponse(context.method, info, body) === info.response;

    if (verified) {
        return sendJson(context, 200, { authenticated: true });
    }

    return send(context, 401, 'Unauthorized', {
        'content-type': HTML_TYPE,
        'www-authenticate': digestChallenge()
    });
}

// `/oauth1` — verify an HMAC-SHA1 signature against the fixture consumer secret. The token secret is always empty,
// so the signing key is the percent-encoded consumer secret followed by `&`.
//
// The base URI is built from the *raw* path, not the normalized one: the client signs the target it actually sent,
// so normalizing here would break verification for a path carrying a doubled slash.
function routeOAuth1 (context) {
    const presented = String((context.headers || {}).authorization || ''),
        info = authInfoParser(presented.replace(/^OAuth /i, '')),
        baseUri = context.scheme + '://' + context.authority + context.url.split('?')[0],
        parameters = { ...parseQuery(context.url), ...info },
        normalized = Object
            .keys(parameters)
            .filter(function (key) {
                return key !== OAUTH_SIGNATURE && key !== OAUTH_REALM;
            })
            .sort()
            .map(function (key) {
                return key + '=' + parameters[key];
            })
            .join('&'),
        baseString = context.method + '&' + encodeURIComponent(baseUri) + '&' + encodeURIComponent(normalized),
        signingKey = encodeURIComponent(OAUTH_KEY) + '&',
        signature = encodeURIComponent(hmacSha1Base64(baseString, signingKey));

    if (signature === parameters[OAUTH_SIGNATURE]) {
        return sendJson(context, 200, {
            status: 'pass',
            message: 'OAuth-1.0a signature verification was successful'
        });
    }

    return sendJson(context, 401, {
        status: 'fail',
        message: 'HMAC-SHA1 verification failed',
        base_uri: baseUri,
        normalized_param_string: normalized,
        base_string: baseString,
        signing_key: signingKey
    });
}

// `/auth/hawk` — verify with `Hawk.server.authenticate`. Hawk gets a plain request description rather than the live
// request: it reads `connection.encrypted` to derive the default port, and `Http2ServerRequest` has no
// `connection`. Deriving the flag from `context.scheme` keeps HTTP/1 and HTTP/2 verification identical.
function routeHawkAuth (context) {
    const request = {
        method: context.method,
        url: context.url,
        headers: context.headers,
        connection: { encrypted: context.scheme === 'https' }
    };

    return Hawk.server
        .authenticate(request, hawkCredentials)
        .then(function () {
            return sendJson(context, 200, { message: 'Hawk Authentication Successful' });
        })
        .catch(function (error) {
            const header = hawkServerHeader(error);

            return send(context, 401, 'rETRY', header ?
                { 'content-type': HTML_TYPE, 'server-authorization': header } :
                { 'content-type': HTML_TYPE });
        });
}

// `/oauth2/token` — issue an access token.
function routeOAuth2Token (context) {
    return sendJson(context, 200, {
        access_token: OAUTH2_ACCESS_TOKEN,
        token_type: 'Bearer',
        expires_in: 3600
    });
}

// `/oauth2/user/info` — return the protected resource.
function routeOAuth2UserInfo (context) {
    return sendJson(context, 200, {
        user_id: OAUTH2_USER_ID,
        name: OAUTH2_USER_NAME
    });
}

// `GET /` on the bare host — redirect to the public documentation.
function routeDocumentation (context) {
    return send(context, 302, 'Found. Redirecting to ' + DOCUMENTATION_URL, {
        'content-type': HTML_TYPE,
        location: DOCUMENTATION_URL
    });
}

// A path the public service answers 404 for.
function routeNotFound (context, path) {
    return sendJson(context, 404, {
        error: 'Not Found',
        method: context.method,
        path: path
    });
}

// Every unimplemented route; a new endpoint has to be implemented here rather than reached externally.
function routeNotImplemented (context, path) {
    return sendJson(context, 501, {
        error: 'Not Implemented',
        message: 'the local Echo fixture server does not implement ' + context.method + ' ' + path +
            ', implement it in test/fixtures/servers/echo-handler.js',
        method: context.method,
        path: path
    });
}

// Buffer the whole request body before routing, so every route sees a fully consumed request.
//
// The `error` listener is required: an unhandled `error` on a Readable throws, so a client resetting mid-body would
// take the fixture server down with it. There is nothing to respond to in that case, so no route is dispatched.
function readBody (req, callback) {
    const chunks = [];

    if (!req || typeof req.on !== 'function') {
        return callback(Buffer.alloc(0));
    }

    req.on('data', function (chunk) {
        chunks.push(Buffer.from(chunk));
    });

    req.on('error', function () {
        chunks.length = 0;
    });

    return req.on('end', function () {
        callback(Buffer.concat(chunks));
    });
}

// Route one buffered request by path only, ignoring the query string.
function dispatch (context, body) {
    const path = requestPath(context.url),
        status = STATUS_PATH_REGEXP.exec(path),
        stream = STREAM_PATH_REGEXP.exec(path),
        delay = DELAY_PATH_REGEXP.exec(path),
        type = TYPE_PATH_REGEXP.exec(path);

    if (status) { return routeStatus(context, Number(status[1])); }
    if (stream) { return routeStream(context, Number(stream[1])); }
    if (delay) { return routeDelay(context, delay[1]); }
    if (type) { return routeType(context, type[1]); }
    if (NOT_FOUND_PATHS.includes(path)) { return routeNotFound(context, path); }

    switch (path) {
        case '/': return routeDocumentation(context);
        case '/get': return routeGet(context);
        case '/headers': return routeHeaders(context);
        case '/post':
        case '/put':
        case '/patch':
        case '/delete': return routeEchoBody(context, body);
        case '/redirect-to': return routeRedirectTo(context);
        case '/cookies': return routeCookies(context);
        case '/cookies/set': return routeCookiesSet(context);
        case '/cookies/delete': return routeCookiesDelete(context);
        case '/response-headers': return routeResponseHeaders(context);
        case '/gzip': return routeCompressed(context, 'gzip');
        case '/deflate': return routeCompressed(context, 'deflate');
        case '/encoding/utf8': return routeEncodingUtf8(context);
        case '/basic-auth': return routeBasicAuth(context);
        case '/digest-auth': return routeDigestAuth(context, body);
        case '/oauth1': return routeOAuth1(context);
        case '/auth/hawk': return routeHawkAuth(context);
        case '/oauth2/token': return routeOAuth2Token(context);
        case '/oauth2/user/info': return routeOAuth2UserInfo(context);
        default: return routeNotImplemented(context, path);
    }
}

module.exports = {
    /**
     * Serve one local Echo request.
     *
     * @param {Object} context - request context built by `echo.js`.
     * @returns {*}
     */
    handle (context) {
        return readBody(context.req, function (body) {
            return dispatch(context, body);
        });
    }
};
