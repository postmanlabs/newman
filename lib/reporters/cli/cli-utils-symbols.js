var IS_WINDOWS = (/^win/).test(process.platform),
    subsets,
    symbols;

subsets = {
    regular: {
        dot: '.',
        folder: '❏',
        root: '→',
        sub: '↳',
        ok: '✓',
        error: '✖'
    },
    encoded: {
        dot: '.',
        folder: '\u25A1',
        root: '\u2192',
        sub: '\u2514',
        ok: '\u221A',
        error: '\u00D7'
    },
    plainText: {
        dot: '.',
        folder: 'Folder',
        root: 'Root',
        sub: 'Sub-folder',
        ok: 'Pass',
        error: 'Fail'
    }
};

symbols = function (disableUnicode) { // @todo: add additional parameter related to temp file read - writes
    if (disableUnicode) {
        return subsets.plainText;
    }
    if (IS_WINDOWS) { // modify symbols for windows platforms
        return subsets.encoded;
    }

    return subsets.regular;
};

module.exports = symbols;
