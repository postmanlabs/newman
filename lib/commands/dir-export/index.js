const path = require('path');
const dirUtils = require('../dir-utils');
const commandUtil = require('../../../bin/util');
const fs = require('fs');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-export <postman-collection-file>')
        .description('Convert a Postman collection file into its directory representation')
        .usage('<postman-collection-file> [options]')
        .option('-s, --substitute-slashes', 'if slashes are found in name field - substitute them')
        .option('-f, --force-overwrite', 'overwrite if directory already exists')
        .option('-q, --quote-unquoted-vars', 'quote unquoted {{variables}} in request body with __UQ__ marker so that raw json can be formatted')
        .option('-o, --output-dir <directory>', 'output directory for the exported collection');
}

function action (collectionFile, command) {
    let collectionFilePath = path.isAbsolute(collectionFile) ?
            collectionFile : path.join(process.cwd(), collectionFile),
        options = commandUtil.commanderToObject(command);

    dirUtils.assertFileExistence(collectionFilePath);

    let collection = require(collectionFilePath);

    // handle different format postman collection file
    if (collection.collection) {
        collection = collection.collection;
    }

    let outputBase = options.outputDir || '.';

    if (options.forceOverwrite) {
        fs.rmSync(`${outputBase}/${collection.info.name}`, { recursive: true, force: true });
    }

    try {
        dirUtils.traverse(collection, [], options, outputBase);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }

    process.exit(0);
}

module.exports = {
    cliSetup,
    action
};
