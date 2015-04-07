var path = require('path');
var _ = require('lodash');
var fs = require('fs');

function template (obj) {
    console.log(__dirname);
    var tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');
    var data = {
        data: obj,
        materializeCss: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.0/css/materialize.min.css',
        materializeJs: 'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.96.0/js/materialize.min.js',
        jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js',
        customCss: fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8'),
        customJs: fs.readFileSync(path.join(__dirname, 'script.js'), 'utf-8'),
        prismCss: fs.readFileSync(path.join(__dirname, 'prism.css'), 'utf-8'),
        prismJs: fs.readFileSync(path.join(__dirname, 'prism.js'), 'utf-8'),
        markdownJs: fs.readFileSync(path.join(__dirname, 'markdown.min.js'), 'utf-8')
    };
    var compiled = _.template(tpl);

    return compiled(data);
}

module.exports = template;