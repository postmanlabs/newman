var inspect = require('util').inspect,
    wrap = require('word-wrap'),
    symbols = require('./cli-utils-symbols'),

    cliUtils;

// set styling for inspect options
inspect.styles.string = 'grey';
inspect.styles.name = 'white';

cliUtils = {

    /**
     * A helper method that picks the right set of symbols for the given set of run conditions.
     *
     * @type {Function}
     */
    symbols: symbols,

    /**
     * A set of blank CLI table symbols (default).
     *
     * @type {Object}
     */
    cliTableTemplate_Blank: {
        top: '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        bottom: '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        middle: '',
        mid: ' ',
        'mid-mid': '',
        'mid-left': '',
        'mid-right': '',
        left: '',
        'left-mid': '',
        'left-left': '',
        'left-right': '',
        right: '',
        'right-mid': '',
        'right-left': '',
        'right-right': ''
    },

    /**
     * A set of fallback CLI table construction symbols, used when unicode has been disabled.
     *
     * @type {Object}
     */
    cliTableTemplateFallback: {
        top: '-',
        'top-mid': '-',
        'top-left': '-',
        'top-right': '-',
        bottom: '-',
        'bottom-mid': '-',
        'bottom-left': '-',
        'bottom-right': '-',
        middle: '|',
        mid: '-',
        'mid-mid': '+',
        'mid-left': '-',
        'mid-right': '-',
        left: '|',
        'left-mid': '-',
        'left-left': '-',
        'left-right': '-',
        right: '|',
        'right-mid': '-',
        'right-left': '-',
        'right-right': '-'
    },

    /**
     * A CLI utility helper method that perfoms left padding on an input string.
     *
     * @param {String} nr - The string to be padded.
     * @param {Number} n - The length of the field, in which to left pad the input string.
     * @param {String=} str - An optional string used for padding the input string. Defaults to '0'.
     * @returns {String} - The resultant left padded string.
     */
    padLeft: function (nr, n, str) {
        return Array(n - String(nr).length + 1).join(str || '0') + nr;
    },

    /**
     * A CLI utility helper method that checks for the non TTY compliance of the current run environment.
     *
     * color:     |  noTTY:
     * 'on'      -> false
     * 'off'     -> true
     * otherwise -> Based on CI or isTTY.
     *
     * @param {String} color - A flag to indicate usage of the --color option.
     * @returns {Boolean} - A boolean value depicting the result of the noTTY check.
     */
    noTTY: function (color) {
        return (color === 'off') || (color !== 'on') &&
            (Boolean(process.env.CI) || !process.stdout.isTTY); // eslint-disable-line no-process-env
    },

    /**
     * A CLI utility helper method that generates a color inspector function for CLI reports.
     *
     * @param {Object} runOptions - The set of run options acquired via the runner.
     * @returns {Function} - A function to perform utils.inspect, given a sample item, under pre-existing options.
     */
    inspector: function (runOptions) {
        var dimension = cliUtils.dimension(),
            options = {
                depth: 25,

                maxArrayLength: 100, // only supported in Node v6.1.0 and up: https://github.com/nodejs/node/pull/6334

                colors: !cliUtils.noTTY(runOptions.color),

                // note that similar dimension calculation is in utils.wrapper
                // only supported in Node v6.3.0 and above: https://github.com/nodejs/node/pull/7499
                breakLength: ((dimension.exists && (dimension.width > 20)) ? dimension.width : 60) - 16
            };

        return function (item) {
            return inspect(item, options);
        };
    },

    /**
     * A CLI utility helper method to provide content wrapping functionality for CLI reports.
     *
     * @returns {Function} - A sub-method to wrap content, given a piece of text, and indent value.
     */
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

    /**
     * A CLI utility helper method to compute and scae the size of the CLI table to be displayed.
     *
     * @returns {Object} - A set of properties: width, height, and TTY existence.
     */
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
            exists: !(Boolean(process.env.CI) || !process.stdout.isTTY), // eslint-disable-line no-process-env
            width: width,
            height: height
        };
    }
};

module.exports = cliUtils;
