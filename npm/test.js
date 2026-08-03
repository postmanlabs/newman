#!/usr/bin/env node
/* eslint-disable n/no-process-env */
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute the entire test suite, one runner at a time, and is what `npm test` runs.
//
// It replaces a chained `npm run a && npm run b` script because `&&` is not portable to `cmd.exe`, and because
// `--live` has to reach the four networked runners without reaching the two that never open a socket.
// ---------------------------------------------------------------------------------------------------------------------

const path = require('path'),
    { spawn } = require('child_process'),

    colors = require('colors/safe'),

    runner = require(path.join(__dirname, '..', 'test', 'fixtures', 'servers', 'runner')),

    LIVE_FLAG = '--live',

    // `npm` is a shell script on POSIX and a `.cmd` shim on Windows, and since the CVE-2024-27980 fix Node refuses
    // to spawn a `.cmd` without a shell. Every argument below is a fixed literal, so `cmd.exe` has nothing to
    // re-interpret.
    WINDOWS = process.platform === 'win32',
    NPM = WINDOWS ? 'npm.cmd' : 'npm',

    // quiets a dependency's DEP0044 warning; appended, not assigned, so nyc's NODE_OPTIONS coverage hook survives
    SUITE_ENV = {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-deprecation'].filter(Boolean).join(' ')
    },

    // in the order they run. `networked` marks the runners that accept `--live`; lint and system tests never open a
    // socket.
    SUITES = [
        { script: 'test-lint', networked: false },
        { script: 'test-system', networked: false },
        { script: 'test-unit', networked: true },
        { script: 'test-integration', networked: true },
        { script: 'test-cli', networked: true },
        { script: 'test-library', networked: true }
    ];

module.exports = function (exit) {
    var live;

    /**
     * Run one suite, then the next, stopping at the first non-zero exit.
     *
     * @param {Number} index - Position of the suite to run within SUITES.
     * @returns {*}
     */
    function run (index) {
        var suite,
            args,
            child;

        if (index === SUITES.length) {
            return exit(0);
        }

        suite = SUITES[index];

        // npm needs the `--` separator before a script's own arguments, or it consumes them itself
        args = live && suite.networked ? ['run', suite.script, '--', LIVE_FLAG] : ['run', suite.script];

        child = spawn(NPM, args, { stdio: 'inherit', shell: WINDOWS, env: SUITE_ENV });

        child.on('error', function (spawnError) {
            console.error(colors.red(`\ncould not run \`${NPM} ${args.join(' ')}\`: ${spawnError.message}`));

            exit(1);
        });

        return child.on('exit', function (code, signal) {
            if (code === 0) {
                return run(index + 1);
            }

            console.error(colors.red(`\n${suite.script} failed${signal ? ` with ${signal}` : ''}.`));

            // a process killed by a signal reports a null code, which still has to be a failing exit
            return exit(code || 1);
        });
    }

    try {
        live = runner.parseArgs(process.argv.slice(2)).live;
    }
    catch (parseError) {
        console.error(colors.red(parseError.message));

        return exit(1);
    }

    // `--live` reaches real public services, so CI has to opt in: `.github/workflows/live.yml` sets
    // `NEWMAN_LIVE_IN_CI`, and nothing else does. A refusal rather than a warning, so a live run can never quietly
    // become a merge gate.
    if (live && process.env.CI && !process.env.NEWMAN_LIVE_IN_CI) {
        console.error(colors.red(`${LIVE_FLAG} is not a merge gate; set NEWMAN_LIVE_IN_CI to run it in CI.`));

        return exit(1);
    }

    return run(0);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
