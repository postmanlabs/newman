#!/usr/bin/env node
require('shelljs/global');
require('colors');

var prettyms = require('pretty-ms'),
    startedAt = Date.now();

require('async').series([
    require('./test-lint'),
    require('./test-system'),
    require('./test-unit'),
    require('./test-integration'),
    require('./test-cli'),
    require('./test-library')
], function (code) {
    console.info(`\nnewman: duration ${prettyms(Date.now() - startedAt)}\nnewman: ${code ? 'not ok' : 'ok'}!`[code ?
        'red' : 'green']);
    exit(code && (typeof code === 'number' ? code : 1) || 0);
});
