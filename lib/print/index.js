var format = require('util').format,
    cliUtils = require('../reporters/cli/cli-utils'),
    SPC = ' ',
    BS = '\b',
    LF = '\n',
    WAIT_FRAMES = (/^win/).test(process.platform) ?
        ['\u2015', '\\', '|', '/'] :
        ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'],
    WAIT_FRAMES_SIZE = WAIT_FRAMES.length - 1,
    WAIT_FRAMERATE = 100,
    print;

/**
 * Function that prints to stdout using standard NodeJS util.format, without end newline.
 *
 * @returns {print} - The result of context bound call to the run context, with all arguments passed.
 * @chainable
 */
print = function () {
    return print.print.apply(this, arguments);
};

/**
 * Function that prints to stdout using standard NodeJS util.format, without end newline.
 *
 * @returns {print} - The updated print module wrapper, with unwait and unbuffer methods invoked.
 * @chainable
 */
print.print = function () {
    print.waiting && print.unwait();
    print._buffer && print.unbuffer();
    process.stdout.write(format.apply(this, arguments));
    return print;
};

/**
 * Print with a line feed at the end.
 *
 * @returns {print} - The updated print module wrapper, with unwait and unbuffer methods invoked.
 * @chainable
 */
print.lf = function () {
    print.waiting && print.unwait();
    print._buffer && print.unbuffer();
    process.stdout.write(format.apply(this, arguments) + LF);
    return print;
};

// store the starting frame during wait
print._waitPosition = 0;

/**
 * Draw a spinner until next print statement is received.
 *
 * @param {Function=} color - Optional color function from `colors` module.
 * @returns {print} - The print module wrapper, with a key set as a setInterval label.
 * @chainable
 */
print.wait = function (color) {
    print.unwait();

    if (cliUtils.noTTY()) {
        return print;
    }

    process.stdout.write(SPC);
    print.waiting = setInterval(function () {
        process.stdout.write(BS +
            (color ? color(WAIT_FRAMES[print._waitPosition++]) : WAIT_FRAMES[print._waitPosition++]));
        (print._waitPosition > WAIT_FRAMES_SIZE) && (print._waitPosition = 0); // move frame
    }, WAIT_FRAMERATE);

    return print;
};

/**
 * Stops a running spinner on CLI. It is automatically taken care of in most cases.
 *
 * @returns {print} - Returns the updated print module wrapper, with the cleared waiting label.
 * @chainable
 * @see print.wait
 */
print.unwait = function () {
    if (print.waiting) {
        print.waiting = clearInterval(print.waiting);
        print._waitPosition = 0;
        process.stdout.write('\b');
    }

    return print;
};

print._buffer = undefined;

/**
 * Prints a message between start and end text. Consequent buffer calls does not print the start text and any other
 * unbuffered call or a delay of time prints the end text.
 *
 * @param {String} startText - The text to begin printing with.
 * @param {String} endText - The text that marks the end of the print routine.
 * @returns {print} - The update print module wrapper with internal buffer and buffering members redefined.
 * @chainable
 */
print.buffer = function (startText, endText) {
    (print._buffer === undefined) && process.stdout.write(startText);
    print._buffer = endText;

    print._buferring && (print._buferring = clearTimeout(print._buferring));
    print._buferring = setTimeout(print.unbuffer, 500);

    process.stdout.write(format.apply(this, Array.prototype.splice.call(arguments, 2)));
    return print;
};

/**
 * Prints text without flushing the buffer.
 *
 * @returns {print} - The update print module wrapper with unwait called.
 * @chainable
 * @see print.buffer
 */
print.nobuffer = function () {
    print.unwait();
    process.stdout.write(format.apply(this, arguments));
    return print;
};

/**
 * Flushes the buffer.
 *
 * @returns {print} - The print module wrapper with internal private members: buffer, and buffering redefined.
 * @chainable
 * @see print.buffer
 */
print.unbuffer = function () {
    print._buferring && (print._buferring = clearTimeout(print._buferring));
    if (print._buffer) {
        process.stdout.write(print._buffer);
        print._buffer = undefined;
    }
    return print;
};

module.exports = print;
