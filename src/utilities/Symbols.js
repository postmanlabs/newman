var jsface = require('jsface');

/**
 * @name Symbols
 * @namespace
 * @classdesc class with symbols used for logging
 */
var Symbols = jsface.Class({
    $singleton: true
});

// symbols for logging
Symbols.symbols =  {
    err: (process.platform === "win32") ? "\u00D7 " : "✗ ",
    ok:  (process.platform === "win32") ? "\u221A " : "✔ "
};

module.exports = Symbols;
