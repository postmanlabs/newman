var util = require('util');
var _ = require('lodash');
var fs = require('fs');

function template (obj) {
    var tpl = fs.readFileSync('./src/templates/template.html', 'utf-8');
    var data = {
        data: obj,
        materializeCss: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.0/css/materialize.min.css',
        materializeJs: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.0/js/materialize.min.js',
        jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js',
        customCss: fs.readFileSync('./src/templates/style.css', 'utf-8'),
        customJs: fs.readFileSync('./src/templates/script.js', 'utf-8'),
        prismCss: fs.readFileSync('./src/templates/prism.css', 'utf-8'),
        prismJs: fs.readFileSync('./src/templates/prism.js', 'utf-8'),
        markdownJs: fs.readFileSync('./src/templates/markdown.min.js', 'utf-8')
    };
    var compiled = _.template(tpl);

    return compiled(data);
}

module.exports = template;