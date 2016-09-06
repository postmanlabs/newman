var prettyms = require('pretty-ms'),
    filesize = require('filesize'),
    inspect = require('util').inspect,
    wrap = require('word-wrap'),

    FILESIZE_OPTIONS = { spacer: '' },

    symbolUtils,
    symbols = {
        regular: {
            dot: '⠄',
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

// set styling for inspect options
inspect.styles.string = 'grey';
inspect.styles.name = 'white';

// @todo - document the cliUtils function
symbolUtils = {
    cliTableTemplate_Blank: {
        'top': '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        'bottom': '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        'middle': '',
        'mid': ' ',
        'mid-mid': '',
        'mid-left': '',
        'mid-right': '',
        'left': '',
        'left-mid': '',
        'left-left': '',
        'left-right': '',
        'right': '',
        'right-mid': '',
        'right-left': '',
        'right-right': ''
    },

    symbolMap: function (disableUnicode) { // @todo: add additional parameter related to temp file read - writes
        if (disableUnicode) {
            return symbols.plainText;
        }
        if ((/^win/).test(process.platform)) { // modify symbols for windows platforms
            return symbols.encoded;
        }

        return symbols.regular;
    },

    padLeft: function (nr, n, str) {
        return Array(n - String(nr).length + 1).join(str || '0') + nr;
    },

    noTTY: function () {
        return Boolean(process.env.CI) || !process.stdout.isTTY;
    },

    prettyms: function (ms) {
        return (ms < 1998) ? `${parseInt(ms, 10)}ms` : prettyms(ms);
    },

    filesize: function (bytes) {
        return filesize(bytes, FILESIZE_OPTIONS);
    },

    inspector: function (noColor) {
        var dimension = cliUtils.dimension(),
            options = {
                colors: !(noColor || cliUtils.noTTY()),
                // note that similar dimension calculation is in utils.wrapper
                breakLength: ((dimension.exists && (dimension.width > 20)) ? dimension.width : 60) - 16
            };

        return function (item) {
            return inspect(item, options);
        };
    },

    wrapper: function () {
        var dimension = cliUtils.dimension(),
            // note that similar dimension calculation is in utils.wrapper
            width = ((dimension.exists && (dimension.width > 20)) ? dimension.width : 60) - 6;

        return function (text, indent) {
            return wrap(text, {
                indent: indent,
                width: width,
                cut: true
            });
        };
    },

    dimension: function () {
        var tty,
            width,
            height;

        try { tty = require('tty'); }
        catch (e) { tty = null; }

        if (tty && tty.isatty(1) && tty.isatty(2)) {
            if (process.stdout.getWindowSize) {
                width = process.stdout.getWindowSize(1)[0];
                height = process.stdout.getWindowSize(1)[1];
            }
            else if (tty.getWindowSize) {
                width = tty.getWindowSize()[1];
                height = tty.getWindowSize()[0];
            }
            else if (process.stdout.columns && process.stdout.rows) {
                height = process.stdout.rows;
                width = process.stdout.columns;
            }
        }

        return {
            exists: !(Boolean(process.env.CI) || !process.stdout.isTTY),
            width: width,
            height: height
        };
    }
};

module.exports = symbolUtils;
