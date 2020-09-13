var envinfo = require('envinfo'),
    colors = require('colors/safe'),

    print = require('../print');

// sets theme for colors for console logging
colors.setTheme({
    log: 'white'
});

/**
 * Module whose job is to print system and environment related information onto the terminal.
 *
 * @returns {*}
 */

module.exports = function () {
    print.lf(colors.log('%s:'), 'Environment Info');

    envinfo.run({
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Browsers: ['Chrome', 'Firefox', 'Safari'],
        npmGlobalPackages: ['newman']
    },
    { json: false, showNotFound: true })
        .then((env) => { return print.lf(colors.log(env)); })
        .catch((err) => { return print.lf(colors.error(err)); });
};

