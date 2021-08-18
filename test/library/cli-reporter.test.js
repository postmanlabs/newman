const Table = require('cli-table3'),
    PostmanCLIReporter = require('../../lib/reporters/cli'),
    runSummary = require('../fixtures/reporters/cli/run-summary.json'),
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
});
