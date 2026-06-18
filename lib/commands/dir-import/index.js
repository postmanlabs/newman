const dirUtils = require('../dir-utils');
const commandUtil = require('../../../bin/util');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-import <collection-dir>')
        .description('Convert a Postman directory representation into a postman collection')
        .usage('<collection-dir> [options]')
        .option('-o, --output-file <file>', 'output collection file, default is collection.json')
        .option('-p, --pretty-print-body', 'pretty-print JSON request body with 4-space indent');
}

function action (collectionDir, command) {
    dirUtils.assertDirectoryExistence(collectionDir);

    let collectionJson = {},
        content,
        options = commandUtil.commanderToObject(command),
        outputFile = 'collection.json';

    if (typeof (options.outputFile) === 'string') {
        outputFile = options.outputFile;
    }
    collectionJson = dirUtils.dirTreeToCollectionJson(collectionDir, options);

    content = JSON.stringify(collectionJson, null, 2);

    dirUtils.createFile(outputFile, content);
    process.exit(0);
}

module.exports = {
    cliSetup,
    action
};
