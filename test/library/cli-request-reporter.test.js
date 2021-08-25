const Table = require('cli-table3'),
    EventEmitter = require('eventemitter3'),
    PostmanCLIRequestReporter = require('../../lib/reporters/cli/cli-request'),
    runSummary = require('../fixtures/reporters/cli/singleRequest-run-summary.json');

describe('PostmanCLIRequestReporter', function () {
    it('parseSingleRequestStatistics should give valid table instance', function () {
        const summarytable = PostmanCLIRequestReporter.parseSingleRequestStatistics(runSummary);

        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('verboseSession should give a verbose object format', function () {
        const summarytable = PostmanCLIRequestReporter.verboseSession(runSummary);

        expect(summarytable).to.eql({ addresses: {}, tls: {} });
    });

    describe('CLI reporter events', function () {
        const options = {
            header: [],
            data: [],
            dataRaw: [],
            dataUrlencode: [],
            form: [],
            uploadFile: [],
            reporters: ['cli'],
            responseLimit: 10485760,
            request: 'GET',
            url: 'https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-xml',
            singleRequest: true
        };

        it('should be listening on multiple events', function () {
            const eventEmitter = new EventEmitter();

            PostmanCLIRequestReporter(eventEmitter, {}, options);

            expect(Object.keys(eventEmitter._events)).to.eql(['done', 'start', 'beforeRequest', 'request']);
        });
    });
});
