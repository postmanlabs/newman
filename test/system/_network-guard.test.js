/* eslint-disable no-process-env */
// Regression test for the blocking half of the network guard. Nothing else in the suite would notice if blocking
// stopped working, so this asserts the `EHERMETIC` code and message specifically, not merely that the request failed.
//
// `unmapped.invalid` (reserved `.invalid` TLD) and `203.0.113.1` (RFC 5737 TEST-NET-3) are used here because both
// are guaranteed never to resolve to a real service, so a block-mode failure here can only mean the guard works.

const childProcess = require('child_process'),
    path = require('path'),

    expect = require('chai').expect,

    servers = require('../fixtures/servers'),
    intercept = require('../fixtures/servers/intercept'),

    // built here rather than through `servers.policy()`, so this does not depend on which hosts the harness maps: an
    // empty `hosts` means both hosts below fall through to the block-mode rejection, with no server to start
    ENCODED_POLICY = intercept.encode({
        block: true,
        hosts: {},
        caFile: path.join(__dirname, '..', 'fixtures', 'ssl', 'ca.crt')
    }),

    // a real dial would hang on the unreachable TEST-NET-3 address or take a DNS round trip, where the guard rejects
    // in well under 100ms
    CHILD_TIMEOUT_MS = 8000,

    // reports the connection error's shape as JSON and exits 0 itself, so every assertion below comes from the
    // payload rather than the child's exit code (which `intercept.js` already drives to 1 on a block)
    CHILD_SCRIPT = [
        'const https = require(\'https\');',
        '',
        'https.get(process.argv[1]).on(\'error\', function (err) {',
        '    process.stdout.write(JSON.stringify({',
        '        code: err.code,',
        '        errno: err.errno,',
        '        syscall: err.syscall,',
        '        hostname: err.hostname,',
        '        message: err.message',
        '    }));',
        '    process.exit(0);',
        '});'
    ].join('\n');

/**
 * Runs `CHILD_SCRIPT` against one URL in a child process with the block-mode policy installed the way a test
 * runner installs it ahead of a CLI child.
 *
 * @param {String} url - the URL the child dials.
 * @returns {Object} the parsed error shape the child reported.
 */
function guardedRequest (url) {
    var env = {
            ...process.env,
            NEWMAN_TEST_NET: ENCODED_POLICY,
            NODE_OPTIONS: [process.env.NODE_OPTIONS, servers.PRELOAD_REQUIRE].filter(Boolean).join(' ')
        },
        child = childProcess.spawnSync(process.execPath, ['-e', CHILD_SCRIPT, url], {
            env: env,
            encoding: 'utf8',
            timeout: CHILD_TIMEOUT_MS
        });

    expect(child.error, 'spawning the child should not itself fail').to.equal(undefined);
    expect(child.signal, url + ': a real network attempt would still be pending past the timeout and get killed')
        .to.equal(null);
    expect(child.status, 'child stderr: ' + child.stderr).to.equal(0);

    return JSON.parse(child.stdout);
}

describe('network guard', function () {
    it('should reject an unmapped hostname with EHERMETIC through the failing-lookup path', function () {
        // Node calls `lookup` for a hostname, so the installed resolver is what reports EHERMETIC here
        var result = guardedRequest('https://unmapped.invalid/');

        expect(result.code).to.equal('EHERMETIC');
        expect(result.errno).to.equal('EHERMETIC');
        expect(result.syscall).to.equal('getaddrinfo');
        expect(result.hostname).to.equal('unmapped.invalid');
        expect(result.message).to.equal('getaddrinfo EHERMETIC unmapped.invalid' + intercept.BLOCKED_HINT);
    });

    it('should reject an unmapped literal IPv4 address with EHERMETIC directly at connect time', function () {
        // Node resolves an IP literal itself and never calls `lookup`, so this covers the separate branch that
        // fails the socket synchronously
        var result = guardedRequest('https://203.0.113.1/');

        expect(result.code).to.equal('EHERMETIC');
        expect(result.errno).to.equal('EHERMETIC');
        expect(result.syscall).to.equal('getaddrinfo');
        expect(result.hostname).to.equal('203.0.113.1');
        expect(result.message).to.equal('getaddrinfo EHERMETIC 203.0.113.1' + intercept.BLOCKED_HINT);
    });
});
