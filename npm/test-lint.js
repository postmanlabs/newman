#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to contain all actions pertaining to code style checking, linting and normalization.
// ---------------------------------------------------------------------------------------------------------------------

const colors = require('colors/safe'),
    { ESLint } = require('eslint'),

    LINT_SOURCE_DIRS = [
        './lib',
        './bin',
        './test',
        './examples/*.js',
        './npm/*.js',
        './index.js'
    ];

module.exports = async function (exit) {
    // banner line
    console.info(colors.yellow.bold('\nLinting files using eslint...'));

    const eslint = new ESLint(),
        results = await eslint.lintFiles(LINT_SOURCE_DIRS),
        errorReport = ESLint.getErrorResults(results),
        formatter = await eslint.loadFormatter();

    // log the result to CLI
    console.info(formatter.format(results));

    (errorReport && !errorReport.length) && console.info(colors.green('eslint ok!'));

    exit(Number(errorReport && errorReport.length) || 0);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
