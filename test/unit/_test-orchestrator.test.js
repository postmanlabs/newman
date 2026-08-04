/* eslint-disable no-process-env */
// Tests for `npm/test.js`, the full-suite orchestrator. None of this spawns a real suite: a throw-away directory
// holding a fake `npm`/`npm.cmd` is prepended to the child's `PATH`, and the fake only logs its argv and exits. Every
// `npm_*` variable is stripped too, so the orchestrator cannot follow one back to the real npm.
//
// Only argument handling and the child-invocation contract are asserted here, not what any real suite does.

const fs = require('fs'),
    os = require('os'),
    path = require('path'),
    childProcess = require('child_process'),

    expect = require('chai').expect,

    ORCHESTRATOR = path.join(__dirname, '..', '..', 'npm', 'test.js'),

    // the fixed, documented run order
    ALL_SUITES = ['test-lint', 'test-system', 'test-unit', 'test-integration', 'test-cli', 'test-library'],

    // the four --live-eligible runners; lint and system must never receive the flag
    NETWORKED_SUITES = ['test-unit', 'test-integration', 'test-cli', 'test-library'],

    // generous next to what the fake npm actually does (one `fs.appendFileSync` and an `exit`), so hitting it means
    // the orchestrator reached something other than the fake
    ORCHESTRATOR_TIMEOUT_MS = 8000;

/**
 * Writes a fake `npm` (POSIX, executable) and `npm.cmd` (Windows) into a fresh `os.tmpdir()` directory, to be
 * prepended to a child's `PATH` ahead of the real npm. Both launchers run the same inline script through `node`: it
 * appends its own argv, JSON encoded, as one line of `logFile`, then exits `1` when `failSuite` appears in that argv
 * and `0` otherwise. The caller removes the directory once the test is done with it.
 *
 * @param {String} logFile - absolute path the fake npm appends one JSON line to per invocation.
 * @param {String} failSuite - a suite name whose invocation should exit non-zero; `''` means "everything succeeds".
 * @returns {String} the directory to prepend to `PATH`.
 */
function writeStubNpm (logFile, failSuite) {
    var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'newman-orchestrator-npm-')),
        launcher = path.join(dir, 'npm'),
        script = [
            '#!/usr/bin/env node',
            'var fs = require(\'fs\'),',
            '    argv = process.argv.slice(2);',
            '',
            'fs.appendFileSync(' + JSON.stringify(logFile) + ', JSON.stringify(argv) + \'\\n\');',
            'process.exit(argv.indexOf(' + JSON.stringify(failSuite) + ') === -1 ? 0 : 1);',
            ''
        ].join('\n');

    fs.writeFileSync(launcher, script);
    fs.chmodSync(launcher, 0o755);
    fs.writeFileSync(path.join(dir, 'npm.cmd'), '@echo off\r\nnode "%~dp0npm" %*\r\n');

    return dir;
}

/**
 * Every JSON encoded argv line the fake npm recorded, in invocation order.
 *
 * @param {String} logFile - the log file passed to `writeStubNpm`.
 * @returns {Array} one array of argv tokens per invocation; `[]` when the file was never written.
 */
function readLog (logFile) {
    if (!fs.existsSync(logFile)) {
        return [];
    }

    return fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).map(function (line) {
        return JSON.parse(line);
    });
}

/**
 * @param {Array} invocations - the result of `readLog`.
 * @returns {Array} the `test-*` token of each invocation's argv, in order.
 */
function suiteNamesIn (invocations) {
    return invocations.map(function (argv) {
        return argv.find(function (token) {
            return token.indexOf('test-') === 0;
        });
    });
}

/**
 * A copy of `process.env` with every `npm_*` variable removed and `CI` unset, so each test controls both
 * explicitly instead of inheriting whatever launched this suite itself.
 *
 * @returns {Object}
 */
function baseEnv () {
    var env = {};

    Object.keys(process.env).forEach(function (key) {
        if (!(/^npm_/i).test(key)) {
            env[key] = process.env[key];
        }
    });

    delete env.CI;

    return env;
}

/**
 * Spawns `node npm/test.js <args>` with `stubDir` prepended to `PATH`, so the fake npm is what runs whenever the
 * orchestrator invokes a suite.
 *
 * @param {Array} args - argv to hand `npm/test.js`, e.g. `['--live']`.
 * @param {String} stubDir - the fake npm directory built by `writeStubNpm`.
 * @param {Object} envOverrides - additional environment for the child, e.g. `{ CI: 'true' }`.
 * @returns {Object} the `child_process.spawnSync` result.
 */
function runOrchestrator (args, stubDir, envOverrides) {
    var env = baseEnv(),

        // Windows env var names are case insensitive, and `Object.keys` can hand back `Path` rather than `PATH`;
        // updating whichever spelling is actually present avoids leaving two conflicting keys behind
        pathKey = Object.keys(env).find(function (key) {
            return key.toUpperCase() === 'PATH';
        }) || 'PATH',
        result;

    env[pathKey] = [stubDir, env[pathKey]].join(path.delimiter);
    Object.assign(env, envOverrides);

    result = childProcess.spawnSync(process.execPath, [ORCHESTRATOR].concat(args), {
        env: env,
        encoding: 'utf8',
        timeout: ORCHESTRATOR_TIMEOUT_MS
    });

    expect(result.error, 'spawning the orchestrator should not itself fail').to.equal(undefined);
    expect(result.signal, 'the orchestrator should not hang past the timeout').to.equal(null);

    return result;
}

describe('npm/test.js orchestrator', function () {
    var tempDirs,
        logDir,
        logFile;

    beforeEach(function () {
        logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'newman-orchestrator-log-'));
        logFile = path.join(logDir, 'invocations.log');
        tempDirs = [];
    });

    afterEach(function () {
        tempDirs.forEach(function (dir) {
            fs.rmSync(dir, { recursive: true, force: true });
        });
        fs.rmSync(logDir, { recursive: true, force: true });
    });

    /**
     * Builds a fake npm that logs to this test's `logFile` and tracks its directory for cleanup.
     *
     * @param {String} failSuite - forwarded to `writeStubNpm`.
     * @returns {String} the directory to prepend to `PATH`.
     */
    function stub (failSuite) {
        var dir = writeStubNpm(logFile, failSuite);

        tempDirs.push(dir);

        return dir;
    }

    it('should run every suite once, in the documented order, forwarding no --live flag by default', function () {
        var result = runOrchestrator([], stub(''), {}),
            invocations = readLog(logFile);

        expect(result.status, 'orchestrator stderr: ' + result.stderr).to.equal(0);
        expect(suiteNamesIn(invocations)).to.eql(ALL_SUITES);
        expect(invocations.some(function (argv) {
            return argv.includes('--live');
        }), '--live must not be forwarded by default').to.be.false;
    });

    it('should forward --live only to the four networked runners, never to lint or system', function () {
        var result = runOrchestrator(['--live'], stub(''), {}),
            invocations = readLog(logFile);

        expect(result.status, 'orchestrator stderr: ' + result.stderr).to.equal(0);
        expect(suiteNamesIn(invocations)).to.eql(ALL_SUITES);

        invocations.forEach(function (argv, index) {
            var suite = ALL_SUITES[index],
                gotLive = argv.includes('--live');

            expect(gotLive, suite + ' --live forwarding').to.equal(NETWORKED_SUITES.includes(suite));
        });
    });

    it('should stop at the first failing suite and not run the ones after it', function () {
        var result = runOrchestrator([], stub('test-unit'), {}),
            invocations = readLog(logFile);

        expect(result.status, 'a failing suite must fail the orchestrator').to.not.equal(0);
        expect(suiteNamesIn(invocations)).to.eql(['test-lint', 'test-system', 'test-unit']);
    });

    it('should reject an unrecognized argument without invoking any suite', function () {
        var result = runOrchestrator(['--bogus'], stub(''), {});

        expect(result.status, 'an unknown argument must be a usage error').to.not.equal(0);
        expect(readLog(logFile), 'no suite may run once argument parsing has failed').to.eql([]);
    });

    it('should reject --live when CI is set without invoking any suite', function () {
        var result = runOrchestrator(['--live'], stub(''), { CI: 'true' });

        expect(result.status, '--live under CI must be a usage error').to.not.equal(0);
        expect(readLog(logFile), 'no suite may run once argument parsing has failed').to.eql([]);
    });

    it('should allow --live under CI once NEWMAN_LIVE_IN_CI opts in', function () {
        var result = runOrchestrator(['--live'], stub(''), { CI: 'true', NEWMAN_LIVE_IN_CI: '1' }),
            invocations = readLog(logFile);

        expect(result.status, 'the opt-in must let a live run through').to.equal(0);
        expect(suiteNamesIn(invocations)).to.eql(ALL_SUITES);

        // the opt-in only lifts the refusal; it must not change which suites `--live` reaches
        ALL_SUITES.forEach(function (suite) {
            var gotLive = invocations.some(function (argv) {
                return argv.includes(suite) && argv.includes('--live');
            });

            expect(gotLive, suite + ' --live forwarding').to.equal(NETWORKED_SUITES.includes(suite));
        });
    });
});
