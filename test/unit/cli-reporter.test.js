var path = require('path'),

    expect = require('expect.js'),
    cliUtils = require(path.join(__dirname, '..', '..', 'lib', 'symbols'));

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
        var symbols = cliUtils.symbolMap(),
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
