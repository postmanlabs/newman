const RunCLI = require('./cli-run.js'),
    RequestCLI = require('./cli-request.js'),

    PostmanCLI = function (emitter, reporterOptions, options) {
        if (options.singleRequest) {
            return new RequestCLI(emitter, reporterOptions, options);
        }

        return new RunCLI(emitter, reporterOptions, options);
    };

module.exports = PostmanCLI;
