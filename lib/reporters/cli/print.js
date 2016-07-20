
var format = require('util').format,
    SPC = ' ',
    BS = '\b',
    LF = '\n',
    WAIT_FRAMES = ['⠄', '⠆', '⠇', '⠋', '⠙', '⠸', '⠰', '⠠', '⠰', '⠸', '⠙', '⠋', '⠇', '⠆'],
    WAIT_FRAMES_SIZE = WAIT_FRAMES.length - 1,
    WAIT_FRAMERATE = 100,
    print;

/**
 * Function that prints to stdout using standard NodeJS util.format, without end newline
 * @returns {print}
 * @chainable
 */
print = function () {
    return print.print.apply(this, arguments);
};

/**
 * Function that prints to stdout using standard NodeJS util.format, without end newline
 * @returns {print}
 * @chainable
 */
print.print = function () {
    print.waiting && print.unwait();
    process.stdout.write(format.apply(this, arguments));
    return print;
};

/**
 * Print with a line feed at the end
 *
 * @returns {print}
 * @chainable
 */
print.lf = function () {
    print.waiting && print.unwait();
    process.stdout.write(format.apply(this, arguments) + LF);
    return print;
};

// store the starting frame during wait
print._waitPosition = 0;

/**
 * Draw a spinner until next print statement is received
 *
 * @param {Function=} [color] optional color function from `colors` module
 * @returns {print}
 * @chainable
 */
print.wait = function (color) {
    print.unwait();

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
 * @returns {print}
 * @chainable
 */
print.unwait = function () {
    if (print.waiting) {
        print.waiting = clearInterval(print.waiting);
        print._waitPosition = 0;
        process.stdout.write('\b');
    }

    return print;
};

module.exports = print;
