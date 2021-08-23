const Table = require('cli-table3'),
    EventEmitter = require('eventemitter3'),
    PostmanCLIRunReporter = require('../../lib/reporters/cli/cli-run'),
    runSummary = require('../fixtures/reporters/cli/singleRequest-run-summary.json'),
    runFailure = require('../fixtures/reporters/cli/run-failure.json');

describe('PostmanCLIRunReporter', function () {
    it('parseStatistics should give valid table instance', function () {
        const summarytable = PostmanCLIRunReporter.parseStatistics(runSummary.stats,
            runSummary.timings,
            runSummary.transfers,
            runSummary.options);

        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('parseFailures should not give any row for no failuires', function () {
        const summarytable = PostmanCLIRunReporter.parseFailures([]);

        expect(summarytable.length).to.eql(0);
        expect(summarytable).to.be.an.instanceof(Table);
    });

    it('parseFailures should give a table for failuires', function () {
        const summarytable = PostmanCLIRunReporter.parseFailures(runFailure);

        expect(summarytable).to.be.an.instanceof(Table);
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

            PostmanCLIRunReporter(eventEmitter, {}, options);

            expect(Object.keys(eventEmitter._events)).to.eql([
                'done', 'start', 'beforeIteration',
                'test', 'beforeItem', 'beforeRequest',
                'request', 'script', 'assertion', 'console'
            ]);
        });
    });
});
