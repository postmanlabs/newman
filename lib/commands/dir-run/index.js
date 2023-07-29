const _ = require('lodash'),
    fs = require('fs'),
    dirUtils = require('../dir-utils'),
    { cliOptions } = require('../run/program-options'),
    { optionCollector, run } = require('../run/collection-runner');


/*
    @param {Command} - An commander Command instance to which this command is added
*/
module.exports = function (program) {
    let prg = program
        .command('dir-run <collection-dir>')
        .description('Runs the tests in collection-dir, with all the provided options')
        .usage('<collection-dir> [options]');

    cliOptions.forEach(function (value) {
        prg = prg.option(...value);
    });

    prg.action(function (collectionDir, command) {
        let collectionJson = dirUtils.dirTreeToCollectionJson(collectionDir),

            tempDir = dirUtils.createTempDir(),
            collectionFile = `${tempDir}/collection.json`;

        dirUtils.createFile(collectionFile, JSON.stringify(collectionJson, null, 2));

        const options = optionCollector(program, collectionFile, command);

        run(options, function (err, summary) {
            const runError = err || summary.run.error || summary.run.failures.length;

            if (err) {
                console.error(`error: ${err.message || err}\n`);
                err.friendly && console.error(`  ${err.friendly}\n`);
            }
            runError && !_.get(options, 'suppressExitCode') && (process.exitCode = 1);
            fs.rmSync(tempDir, { recursive: true });
        });
    });
};
