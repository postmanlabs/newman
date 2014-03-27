/** 
 * Helper module with useful methods used throughout newman
 */

var jsface = require('jsface');

var Helpers = jsface.Class({
    $singleton: true,
    isValidUrl: function(url) {
        return false;
    }
});

module.exports = Helpers;
