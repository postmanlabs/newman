#!/usr/bin/env node
/* eslint-disable n/no-process-env */
// Loaded by every Mocha worker, and appended to `NODE_OPTIONS` as `--require` by `npm/test-cli.js` so every
// `node ./bin/newman.js` child installs its parent's policy. An absent `NEWMAN_TEST_NET` means no policy was
// installed on purpose; a present but unusable one throws rather than leaving the child unguarded.

const intercept = require('./intercept'),

    ENCODED_POLICY = process.env.NEWMAN_TEST_NET;

if (ENCODED_POLICY !== undefined) {
    intercept.install(intercept.decode(ENCODED_POLICY));
}
