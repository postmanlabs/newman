#!/usr/bin/env node
require('shelljs/global');
require('colors');

var prettyms = require('pretty-ms'),
    startedAt = Date.now();

require('async').series([
    require('./test-lint'),
    require('./test-system'),
    require('./test-unit'),
    require('./test-integration')
], function (code) {
    console.log(`\nnewman: duration ${prettyms(Date.now() - startedAt)}\nnewman: ${code ? 'not ok' : 'ok'}!`[code ?
        'red' : 'green']);
    exit(code);
});
