const _ = require('lodash'),
    { optionCollector, run } = require('./collection-runner'),
    { addRunOptions } = require('../run/program-options');

function cliSetup (program) {
    // The `run` command allows you to specify a collection to be run with the provided options.
    let prg = program
        .command('run <collection>')
        .description('Initiate a Postman Collection run from a given URL or path')
        .usage('<collection> [options]');

    /*
    cliOptions.forEach(function (value) {
        console.log(`@@@@ creation option in cliSetup: ${value}`);
        prg = prg.option(...value);
    });
    */
    prg = addRunOptions(prg);

    return prg;
}

function action (collection, command, program) {
    const options = optionCollector(program, collection, command);

    run(options, function (err, summary) {
        const runError = err || summary.run.error || summary.run.failures.length;

        if (err) {
            console.error(`error: ${err.message || err}\n`);
            err.friendly && console.error(`  ${err.friendly}\n`);
        }
        runError && !_.get(options, 'suppressExitCode') && (process.exitCode = 1);
    });
}

module.exports = {
    cliSetup,
    action
};
