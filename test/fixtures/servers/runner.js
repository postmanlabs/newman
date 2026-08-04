/* eslint-disable no-process-env */
// Shared startup and teardown for every `npm/test-*.js` runner. A runner has exactly two invocations:
//
//   - default: the fixture servers start, the policy built from their real ports is installed here and handed to
//     child processes through `NEWMAN_TEST_NET`, and anything neither mapped nor allowed fails with `EHERMETIC`;
//   - `--live`: the same servers start, but no policy is installed, so every non-local fixture URL reaches its real
//     public service. A manual smoke test, never a merge gate.
//
// The servers start in both modes because each binds an ephemeral port and hands it to the fixtures as a variable,
// so there is nothing to select between.
//
// `preload.js` reads `NEWMAN_TEST_NET` in child processes and Mocha workers. This module is its main writer;
// `test/system/_network-guard.test.js` also writes it, into the environment of a child it spawns.

const intercept = require('./intercept'),
    servers = require('./index'),

    LIVE_FLAG = '--live',

    POLICY_ENV = 'NEWMAN_TEST_NET',
    NODE_OPTIONS_ENV = 'NODE_OPTIONS',
    NO_DEPRECATION_FLAG = '--no-deprecation',

    USAGE = 'expected no arguments or a single `' + LIVE_FLAG + '`, got: ';

/**
 * Parse a runner's own command line. An unrecognized argument is a usage error rather than something to ignore, so
 * a mistyped flag cannot leave the suite running in a mode nobody asked for.
 *
 * @param {Array} argv - typically `process.argv.slice(2)`.
 * @returns {Object} `{ live: Boolean }`
 */
function parseArgs (argv) {
    var args = argv || [];

    if (!args.length) {
        return { live: false };
    }

    if (args.length === 1 && args[0] === LIVE_FLAG) {
        return { live: true };
    }

    throw new Error(USAGE + args.join(' '));
}

/**
 * Bring up everything a runner needs before Mocha loads a spec file, and hand back the function that takes it all
 * down again.
 *
 * `block: false` is the `--live` shape: the servers still start and publish their ports, but no policy is installed
 * so nothing is intercepted. `block` is always an explicit boolean, because `JSON.stringify` drops an `undefined`
 * on its way to a child and would leave that child unguarded.
 *
 * @param {Object} options - `{ block: Boolean }`
 * @param {Function} callback - `(err, cleanup)`, where `cleanup(callback)` reverses all of it.
 * @returns {*}
 */
function startForRunner (options, callback) {
    var saved = [POLICY_ENV, servers.PORTS_ENV, NODE_OPTIONS_ENV].map(function (name) {
        return { name: name, had: Object.hasOwn(process.env, name), value: process.env[name] };
    });

    // a dependency's own deprecated API use (e.g. a bare `require('punycode')`) can print a Node deprecation
    // warning on some Node versions; suppressed here so a passing run stays quiet. `noDeprecation` covers this
    // process's own in-process `newman.run()` calls; the `NODE_OPTIONS` flag covers a forked Mocha worker or a
    // spawned `node ./bin/newman.js` child, neither of which inherits this process's in-memory flag.
    process.noDeprecation = true;
    process.env[NODE_OPTIONS_ENV] = [process.env[NODE_OPTIONS_ENV], NO_DEPRECATION_FLAG].filter(Boolean).join(' ');

    /**
     * Puts every saved variable back the way it was, deleting one that was unset rather than writing `'undefined'`
     * into it.
     *
     * @returns {undefined} nothing.
     */
    function restoreEnv () {
        saved.forEach(function (entry) {
            if (entry.had) {
                process.env[entry.name] = entry.value;

                return;
            }

            delete process.env[entry.name];
        });
    }

    /**
     * Tears down in the reverse order of setup, so nothing can be routed to a fixture server that is going away.
     * Every step is safe to run when its counterpart never happened, so this is callable from a failed start too.
     *
     * @param {Function} done - `(err)`; an error here means a fixture server would not close.
     * @returns {*}
     */
    function cleanup (done) {
        intercept.uninstall();
        restoreEnv();

        return servers.close(done);
    }

    return servers.start(function (startError) {
        var policy;

        // whatever came up before the failure still has to come down, and the start failure is what gets reported
        if (startError) {
            return cleanup(function () {
                return callback(startError);
            });
        }

        // published in both modes, and before the `--live` return below: a Mocha worker has its own module instance
        // in which no server ever started, so this is how the ports reach the specs that need them
        process.env[servers.PORTS_ENV] = JSON.stringify(servers.ports());

        // `--live`: no policy, so no seam and no `NEWMAN_TEST_NET`. There is no way to ask for a mapped but
        // unblocked run, which is neither supported mode and would let an unmapped host out.
        if (!options.block) {
            return callback(null, cleanup);
        }

        try {
            policy = servers.policy({ block: options.block });

            intercept.install(policy);

            process.env[POLICY_ENV] = intercept.encode(policy);
        }
        catch (installError) {
            return cleanup(function () {
                return callback(installError);
            });
        }

        return callback(null, cleanup);
    });
}

module.exports = {
    parseArgs,
    startForRunner
};
