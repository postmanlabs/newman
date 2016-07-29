var prettyms = require('pretty-ms'),
    filesize = require('filesize'),

    FILESIZE_OPTIONS = { spacer: '' };

// @todo - document the cliUtils function
module.exports = {
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
