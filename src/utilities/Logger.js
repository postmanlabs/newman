var jsface = require("jsface"),
    Symbols = require('./Symbols'),
    Globals = require('./Globals'),
    _und = require('underscore'),
    EventEmitter = require('../utilities/EventEmitter'),
    color = require("cli-color"),
    ansiTrim = require("cli-color/lib/trim");

/**
 * @name Logger
 * @namespace
 * @classdef Logger class, used for all logging inside newman
 */
var Logger = jsface.Class([EventEmitter], {
    $singleton: true,

    main: function () {
        _und.mixin({
            capitalize: function (string) {
                return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
            },

            padStringFromRight: function (string, length) {
                if (string.length > length) {
                    return string.substring(0, length - 3) + "...";
                }
                else {
                    var dif = length - string.length;
                    for (var i = 0; i < dif; i++) {
                        string += " ";
                    }
                    return string;
                }
            },

            padStringFromLeft: function (string, length) {
                if (string.length > length) {
                    return string.substring(0, length - 3) + "...";
                }
                else {
                    var dif = length - string.length;
                    for (var i = 0; i < dif; i++) {
                        string = " " + string;
                    }
                    return string;
                }
            }
        });
    },

    _printMessage: function (string, colorFunc) {
        if (Globals.noColor) {
            string = ansiTrim(colorFunc(string));
        } else {
            string = colorFunc(string);
        }
        process.stdout.write(string);
    },

    success: function (log) {
        this._printMessage(log, color.green);
        return this;
    },

    error: function (log) {
        this._printMessage(log, color.red);
        return this;
    },

    notice: function (log) {
        this._printMessage(log, color.cyan);
        return this;
    },

    warn: function (log) {
        this._printMessage(log, color.yellow);
        return this;
    },

    normal: function (log) {
        if (Globals.whiteScreen) {
            this._printMessage(log, color.black);
        }
        else {
            this._printMessage(log, color.white);
        }
        return this;
    },

    light: function (log) {
        this._printMessage(log, color.underline.xterm(245));
        return this;
    },

    note: function (log) {
        this._printMessage(log, color.underline.xterm(33));
        return this;
    },

    testCaseSuccess: function (log) {
        var msg = Symbols.symbols.ok;
        if (Globals.noTestSymbols) {
            msg = "PASS ";
        }
        this.success("    " + msg + log + "\n");
        return this;
    },

    testCaseError: function (log) {
        var msg = Symbols.symbols.err;
        if (Globals.noTestSymbols) {
            msg = "FAIL ";
        }
        this.error("    " + msg + log + "\n");
        if (Globals.stopOnError) {
            if (Globals.asLibrary) {
                this.emit('iterationRunnerOver', 1);
            }
            else {
                if (Globals.updateMessage) {
                    console.log(Globals.updateMessage);
                }
                process.exit(1);
            }
        }
        else {
            Globals.exitCode = 1;
        }
        return this;
    },

    throwError: function (msg) {
        var err = new Error(msg);
        this.error(err.message);
        throw err;
    },

    exceptionError: function (err) {
        this.error((err.message || err));
        if (Globals.stopOnError) {
            if (Globals.asLibrary) {
                this.emit('iterationRunnerOver', 1);
            }
            else {
                if (Globals.updateMessage) {
                    console.log(Globals.updateMessage);
                }
                process.exit(1);
            }
        }
        else {
            Globals.exitCode = 1;
        }
    },

    showIterationSummary: function (summaryArray) {
        this.normal("\nSummary:\n\n");
        this.normal(_und.padStringFromRight("Parent", 25) + "\t" + _und.padStringFromLeft("Pass Count", 10) + "\t" + _und.padStringFromLeft("FailCount", 10) + "\n");
        this.normal("-------------------------------------------------------------\n");
        var oldThis = this;
        _und.map(summaryArray, function (summary) {
            if (summary.type === 'total') {
                oldThis.normal("\n");
            }

            var col1 = _und.capitalize(summary.type) + " " + summary.parentName;
            var col2 = summary.passCount + "";
            var col3 = summary.failCount + "";
            oldThis.normal(_und.padStringFromRight(col1, 25) + "\t");
            oldThis.success(_und.padStringFromLeft(col2, 10) + "\t");
            oldThis.error(_und.padStringFromLeft(col3, 10) + "\n");
        });
    }
});

module.exports = Logger;
