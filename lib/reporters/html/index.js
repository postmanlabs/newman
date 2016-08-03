var fs = require('fs'), // @todo: remove once HTML report contents have been verified
    path = require('path'),
    handlebars = require('handlebars'),

    FILE_READ_OPTIONS = { encoding: 'utf8' },

    PostmanHTMLReporter;

PostmanHTMLReporter = function (emitter, options) {
    // @todo load reporter template here so that we can give early warning if it fails
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var exportPath = options.export,
        compiler = handlebars.compile(fs.readFileSync(path.join(__dirname, 'template-default.hbs'), FILE_READ_OPTIONS));

    emitter.on('beforeDone', function () {
        this.summary.exports.push({
            path: exportPath,
            content: compiler(this.summary)
        });
    });
};

module.exports = PostmanHTMLReporter;
