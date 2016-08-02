var PostmanHTMLReporter;

PostmanHTMLReporter = function (emitter, options) {
    // @todo load reporter template here so that we can give early warning if it fails
    // @todo throw error here or simply don't catch them and it will show up as warning on newman
    var exportPath = options.export; // @todo maybe validate writeable?

    emitter.on('beforeDone', function () {
        var content = '';
        content += '<pre>aha</pre>'; // @todo prepare HTML here

        this.summary.exports.push({
            path: exportPath,
            content: content
        });
    });
};

module.exports = PostmanHTMLReporter;
