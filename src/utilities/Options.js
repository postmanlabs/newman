var jsface = require("jsface");

/**
 * @name Options
 * @classdesc Options meant to be used as mixin
 * @namespace
 */
var Options = jsface.Class({
    setOptions: function (opts) {
        this.opts = opts;
    },
    getOptions: function () {
        return this.opts;
    }
});

module.exports = Options;
