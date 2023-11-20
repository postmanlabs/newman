const commandUtil = require('../../../bin/util'),
    dirUtils = require('../dir-utils');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-add-folder <folder-path>')
        .description('Add a folder to directory based Postman collection in the given path')
        .usage('<folder-path> [options]')
        .option('-f, --force-overwrite', 'overwrite if test already exists', false);
}

function action (folderPath, command) {
    const options = commandUtil.commanderToObject(command);

    // check if test with same name exists when forceOverwrite is false
    if (!options.forceOverwrite) {
        dirUtils.assertDirectoryAbsence(folderPath);
    }

    dirUtils.createPostmanFolder(folderPath);
}

module.exports = {
    cliSetup,
    action
};
