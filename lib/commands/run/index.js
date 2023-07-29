const _ = require('lodash'),
    { optionCollector, run } = require('./collection-runner'),
    { cliOptions } = require('../run/program-options');

module.exports = function (program) {
    // The `run` command allows you to specify a collection to be run with the provided options.
    let prg = program
        .command('run <collection>')
        .description('Initiate a Postman Collection run from a given URL or path')
        .usage('<collection> [options]');

    cliOptions.forEach(function (value) {
        prg = prg.option(...value);
    });

    prg.action(function (collection, command) {
        const options = optionCollector(program, collection, command);

        run(options, function (err, summary) {
            const runError = err || summary.run.error || summary.run.failures.length;

            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.friendly && console.error(`  ${err.friendly}\n`);
            }
            runError && !_.get(options, 'suppressExitCode') && (process.exitCode = 1);
        });
    });
};
