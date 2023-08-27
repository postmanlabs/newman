const commandUtil = require('../../../bin/util'),
    fs = require('fs'),
    dirUtils = require('../dir-utils');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-create <collection-path>')
        .description('Create a directory based Postman collection in the given path')
        .usage('<collection-path> [options]')
        .option('-f, --force-overwrite', 'overwrite if collection directory already exists', false);
}

function action (collectionPath, command) {
    const options = commandUtil.commanderToObject(command),
        trimmedCollectionPath = collectionPath.replace(/\/+$/, ''),
        collectionTemplate = __dirname + '/templates/Sample Postman Collection';

    // check if test with same name exists when forceOverwrite is false
    if (!options.forceOverwrite) {
        dirUtils.assertDirectoryAbsence(collectionPath);
    }

    // copy from template
    try {
        fs.cpSync(collectionTemplate, trimmedCollectionPath, { recursive: true });
    }
    catch (e) {
        console.error(`Could not copy from template at ${collectionTemplate}`);
        fs.rmSync(`${collectionPath}`, { recursive: true, force: true });
        process.exit(-1);
    }
}

module.exports = {
    cliSetup,
    action
};
