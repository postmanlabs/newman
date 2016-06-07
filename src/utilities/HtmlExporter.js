var jsface = require('jsface'),
    log = require('./Logger'),
    fs = require('fs');

/**
 * @class HtmlExporter
 * @classdesc Class Used to generate pretty html reports
 */
var HtmlExporter = jsface.Class({
    $singleton: true,
    templates: null,
    generateHTML: function (filepath, resultObj) {
        var template;
        //Always use existing file
        template = require('../templates/htmlResponseTemplate');
        try {
            fs.writeFileSync(filepath, template(resultObj));
        }
        catch (err) {
            log.error("Error writing to file. Try using sudo. Error: " + (err.stack || err));
        }
    }
});

module.exports = HtmlExporter;
