var path = require('path');
var _ = require('lodash');
var fs = require('fs');

function template (obj) {
    var template = read('template.ejs');
    var fragments = {
        header: _.template(read('fragments/navigation.ejs'))(obj),
        mainPage: _.template(read('fragments/main_page.ejs'))(obj),
        requestPage: _.template(read('fragments/request_page.ejs'))(obj)
    };
    var statics = {
        customCss: read('statics/style.css'),
        customJs: read('statics/script.js'),
        prismCss: read('statics/prism.css'),
        prismJs: read('statics/prism.js'),
        markdownJs: read('statics/markdown.min.js'),
        materializeCss: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.0/css/materialize.min.css',
        materializeJs: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.0/js/materialize.min.js',
        jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js'
    };
    var compiled = _.template(template);

    return compiled({
        fragments: fragments,
        statics: statics
    });
}

function read (name) {
    return fs.readFileSync(path.join(__dirname, name), 'utf-8');
}

module.exports = template;