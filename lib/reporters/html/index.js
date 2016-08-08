var fs = require('fs'), // @todo: remove once HTML report contents have been verified
    path = require('path'),
    handlebars = require('handlebars'),

    FILE_READ_OPTIONS = { encoding: 'utf8' },
    DEFAULT_TEMPLATE = 'template-default.hbs',

    PostmanHTMLReporter;

PostmanHTMLReporter = function (newman, options) {
    // @todo load reporter template here so that we can give early warning if it fails
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var compiler = handlebars.compile(fs.readFileSync(path.join(__dirname, DEFAULT_TEMPLATE), FILE_READ_OPTIONS));

    newman.on('beforeDone', function () {
        this.exports.push({
            name: 'html-reporter',
            default: 'newman-run-report.html',
            path: options.export,
            content: compiler(this.summary)
        });
    });
};

module.exports = PostmanHTMLReporter;
