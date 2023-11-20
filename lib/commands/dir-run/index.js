const _ = require('lodash'),
    fs = require('fs'),
    dirUtils = require('../dir-utils'),
    { addRunOptions } = require('../run/program-options'),
    { optionCollector, run } = require('../run/collection-runner');


/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    let prg = program
        .command('dir-run <collection-dir>')
        .description('Runs the tests in collection-dir, with all the provided options')
        .usage('<collection-dir> [options]');

    prg = addRunOptions(prg);

    return prg;
}

function action (collectionDir, command, program) {
    let tempDir = dirUtils.createTempDir(),
        collectionFile = `${tempDir}/collection.json`,
        collectionJson;

    try {
        collectionJson = dirUtils.dirTreeToCollectionJson(collectionDir);
    }
    catch (e) {
        console.error(`error: Unable to convert directory to collection: ${e.message}`);
        fs.rmSync(tempDir, { recursive: true });
        process.exit(-1);
    }

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
}

module.exports = {
    cliSetup,
    action
};
