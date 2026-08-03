/* eslint-disable n/no-process-env */
// ---------------------------------------------------------------------------------------------------------------------
// Mocha options shared by the runners that parallelise: `test-unit`, `test-cli` and `test-library`.
// ---------------------------------------------------------------------------------------------------------------------

const fs = require('fs'),

    colors = require('colors/safe'),

    TIMEOUT = 1000 * 60,

    // `describe.only` and friends. Loose on purpose: a match inside a string or a comment costs this run its
    // parallelism and nothing else.
    ONLY_REGEXP = /\b(?:describe|context|it|specify)\.only\s*\(/;

/**
 * Build the Mocha options for a parallelising runner.
 *
 * `parallel` is dropped for the whole run as soon as any spec file uses `.only`, because Mocha throws
 * ``` `.only` is not supported in parallel mode ``` while loading that file and the run fails. `forbidOnly` under CI
 * is the other half of that: there, a committed `.only` is a mistake rather than a request.
 *
 * @param {Array} files - the spec files the runner is about to hand to Mocha.
 * @param {Array} requires - modules each parallel worker must load before its spec file, since a worker runs in its
 * own process.
 * @returns {Object} options for `new Mocha()`.
 */
module.exports = function (files, requires) {
    var ci = Boolean(process.env.CI),

        focused = files.filter(function (file) {
            return ONLY_REGEXP.test(fs.readFileSync(file, 'utf8'));
        });

    // the fallback is a local convenience; CI keeps parallelism on and lets `forbidOnly` stop the run instead
    if (focused.length && !ci) {
        console.info(colors.yellow(`\n\`.only\` found in ${focused.length} file(s), running serially:`));
        focused.forEach(function (file) {
            console.info(colors.yellow(`  ${file}`));
        });
        console.info('');
    }

    return {
        timeout: TIMEOUT,
        parallel: ci || !focused.length,
        forbidOnly: ci,
        require: requires
    };
};
