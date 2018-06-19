/* global describe, it, expect */
describe('unicode handling of cli symbol utility module', function () {
    var cliUtilsSymbols = require('../../lib/reporters/cli/cli-utils-symbols.js');

    it('should revert to text alternatives when disableUnicode parameter is set to true', function () {
        var symbols = cliUtilsSymbols(true);

        expect(symbols).to.eql({
            console: {
                top: '-',
                middle: '|',
                bottom: '-'
            },
            dot: '.',
            folder: 'Folder',
            root: 'Root',
            sub: 'Sub-folder',
            ok: 'Pass',
            error: 'Fail'
        });
    });

    it('should provide the platform-specific default symbol map when no options are passed', function () {
        var symbols = cliUtilsSymbols(),
            isWin = (/^win/).test(process.platform);

        expect(symbols).to.eql(isWin ? {
            console: {
                top: '\u250C',
                middle: '\u2502',
                bottom: '\u2514'
            },
            dot: '.',
            folder: '□',
            root: '→',
            sub: '└',
            ok: '√',
            error: '×'
        } : {
            console: {
                top: '┌',
                middle: '│',
                bottom: '└'
            },
            dot: '.',
            folder: '❏',
            root: '→',
            sub: '↳',
            ok: '✓',
            error: '✖'
        });
    });
});
