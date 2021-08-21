const runCLI = require('./cli-run.js'),
    requestCLI = require('./cli-request.js'),

    PostmanCLI = function (emitter, reporterOptions, options) {
        if (options.singleRequest) {
            return requestCLI(emitter, reporterOptions, options);
        }

        runCLI(emitter, reporterOptions, options);
    };

module.exports = PostmanCLI;
