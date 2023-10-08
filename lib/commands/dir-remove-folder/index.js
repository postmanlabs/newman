const dirUtils = require('../dir-utils');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-remove-folder <folder-path>')
        .description('Remove folder at given path from directory based Postman collection')
        .usage('<folder-path>');
}

function action (folderPath) {
    dirUtils.removePostmanFolder(folderPath);
}

module.exports = {
    cliSetup,
    action
};
