var _ = require('lodash'),
    PostmanLoggerReporter;

/**
 * Reporter that simply logs the console calls to file (default: newman-run-logs.txt).
 *
 * @param {Object} emitter - The collection run object, with event hooks for reporting run details.
 * @param {Object} reporterOptions - CLI reporter options object.
 * @param {Object} collectionRunOptions - A set of collection run options.
 * @param {String} collectionRunOptions.export - The path to which the logs must be written.
 * @param {Boolean=} reporterOptions.clean - Boolean flag to log only console events.
 * @returns {*}
 */

PostmanLoggerReporter = function (emitter, reporterOptions, collectionRunOptions) {
    var collectionName = collectionRunOptions.collection.name,
        preRequestLog,
        requestLog,
        testLog,
        runState,
        requestMethod,
        requestUrl,
        itemName,
        finalLog;

    emitter.on('beforeItem', function () {
        preRequestLog = '';
        requestLog = '';
        testLog = '';
        runState = 'pre-request';
        itemName = '';
        finalLog = [];
    });

    emitter.on('beforePrerequest', function (err) {
        if (err) { return; }
        runState = 'pre-request';
    });

    emitter.on('beforeRequest', function (err, o) {
        if (err) { return; }
        runState = 'request';
        requestMethod = o.request.method;
        requestUrl = o.request.url.toString();
    });

    emitter.on('beforeTest', function (err) {
        if (err) { return; }
        runState = 'test';
    });

    emitter.on('item', function (err, o) {
        if (err) { return; }

        itemName = `${o.item.name}\n `;
        let PreReqLog = `pre-request:\n ${preRequestLog}\n `,
            reqLog = `request:\n ${requestMethod} ${requestUrl}\n ${requestLog}\n test:\n ${testLog}\n `,
            itemLog = (!reporterOptions.clean) ? itemName + PreReqLog + reqLog : ` ${preRequestLog}${requestLog}${testLog}`;

        finalLog.push(itemLog);
    });

    emitter.on('console', function (err, o) {
        if (err) { return; }

        switch (runState) {
            case 'pre-request':
                preRequestLog += `${o.messages} \n `;
                break;
            case 'request':
                requestLog += `${o.messages} \n `;
                break;
            case 'test':
                testLog += `${o.messages} \n `;
                break;
            default:
                break;
        }
    });

    emitter.on('beforeDone', function (err) {
        if (err) { return; }

        _.reduce(finalLog, function(compiledLog, log) {
            return compiledLog += `${log}\n\n`;
        }, '');
        finalLog = (!reporterOptions.clean) ? `${collectionName} \n\n ${finalLog}` : finalLog;

        emitter.exports.push({
            name: 'logger-reporter',
            default: 'newman-run-logs.txt',
            path: collectionRunOptions.export,
            content: finalLog
        });
    });
};

module.exports = PostmanLoggerReporter;
