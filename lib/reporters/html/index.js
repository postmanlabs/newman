var fs = require('fs'),
    path = require('path'),
    handlebars = require('handlebars'),

    PostmanHTMLReporter;

PostmanHTMLReporter = function (emitter, options) {
    // @todo load reporter template here so that we can give early warning if it fails
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var exportPath = options.output; // @todo maybe validate writeable?

    emitter.on('beforeDone', function () {
        var HTML,
            compiler,
            templateContent = fs.readFileSync(path.join(__dirname, 'template-default.hbs'), { encoding: 'utf8' });

        compiler = handlebars.compile(templateContent);
        HTML = compiler(this);
        fs.writeFileSync(exportPath, HTML);

        this.summary.exports.push({
            path: exportPath,
            content: HTML
        });
    });
};

module.exports = PostmanHTMLReporter;
