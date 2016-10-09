var IS_WINDOWS = (/^win/).test(process.platform),
    subsets,
    symbols;

/**
 * A set of symbol groups for use in different situations: regular, windows friendly unicode, and plain text.
 *
 * @type {Object}
 */
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

/**
 * A method that picks the appropriate set of CLI report symbols under a given set of run conditions.
 *
 * @param  {Boolean} disableUnicode - A flag to force plain text equivalents for CLI symbols if set to true.
 * @returns {Object} - The right set of symbols from subsets for the given conditions.
 */
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
