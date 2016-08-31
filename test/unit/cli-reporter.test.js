var expect = require('expect.js'),
    cliUtils = require('../../lib/reporters/cli/cli-utils');

/* global describe, it */
describe.only('Unicode handling', function () {
    it('must revert to text alternatives when --disable-unicode is provided', function () {
        var symbols = cliUtils.symbolMap(true);

        expect(symbols).to.eql({
            dot: '.',
            folder: 'Folder',
            root: 'Root',
            sub: 'Sub-folder',
            ok: 'Pass',
            error: 'Fail'
        });
    });

    it('must provide the default symbol map when no options are passed', function () {
        var symbols = cliUtils.symbolMap();

        expect(symbols).to.eql({
            dot: '⠄',
            folder: '❏',
            root: '→',
            sub: '↳',
            ok: '✓',
            error: '✖'
        });
    });
});
