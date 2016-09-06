var expect = require('expect.js');

/* global describe, it */
describe('unicode handling of cli symbol utility module', function () {
    var cliUtilsSymbols = require('../../lib/reporters/cli/cli-utils-symbols.js');

    it('must revert to text alternatives when disableUnicode parameter is set to true', function () {
        var symbols = cliUtilsSymbols(true);

        expect(symbols).to.eql({
            dot: '.',
            folder: 'Folder',
            root: 'Root',
            sub: 'Sub-folder',
            ok: 'Pass',
            error: 'Fail'
        });
    });

    it('must provide the platform-specific default symbol map when no options are passed', function () {
        var symbols = cliUtilsSymbols(),
            isWin = (/^win/).test(process.platform);

        expect(symbols).to.eql(isWin ? {
            dot: '.',
            folder: '□',
            root: '→',
            sub: '└',
            ok: '√',
            error: '×'
        } : {
            dot: '⠄',
            folder: '❏',
            root: '→',
            sub: '↳',
            ok: '✓',
            error: '✖'
        });
    });
});
