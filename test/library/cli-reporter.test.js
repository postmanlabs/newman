const Table = require('cli-table3'),
    EventEmitter = require('eventemitter3'),
    PostmanCLIReporter = require('../../lib/reporters/cli'),
    runSummary = require('../fixtures/reporters/cli/singleRequest-run-summary.json'),
    runFailure = require('../fixtures/reporters/cli/run-failure.json');

describe('PostmanCLIReporter', function () {
    it('parseStatistics should give valid table instance', function () {
        const summarytable = PostmanCLIReporter.parseStatistics(runSummary.stats,
            runSummary.timings,
            runSummary.transfers,
            runSummary.options);

        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('parseSingleRequestStatistics should give valid table instance', function () {
        const summarytable = PostmanCLIReporter.parseSingleRequestStatistics(runSummary);

        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('parseFailures should not give any row for no failuires', function () {
        const summarytable = PostmanCLIReporter.parseFailures([]);

        expect(summarytable.length).to.eql(0);
        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('parseFailures should give a table for failuires', function () {
        const summarytable = PostmanCLIReporter.parseFailures(runFailure);

        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('verboseSession should give a verbose object format', function () {
        const summarytable = PostmanCLIReporter.verboseSession(runSummary);

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
            curl: 'curl --request \'GET\' https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-xml',
            singleRequest: true
        };

        it('should be listening on multiple events', function () {
            const eventEmitter = new EventEmitter();

            PostmanCLIReporter(eventEmitter, {}, options);

            expect(Object.keys(eventEmitter._events)).to.eql([
                'done', 'start', 'beforeIteration',
                'test', 'beforeItem', 'beforeRequest',
                'request', 'script', 'assertion', 'console'
            ]);
        });
    });
});
