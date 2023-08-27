const commandUtil = require('../../../bin/util'),
    path = require('path'),
    fs = require('fs'),
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
    const options = commandUtil.commanderToObject(command),
        parentDir = path.dirname(folderPath),
        trimmedFolderPath = folderPath.replace(/\/+$/, ''),
        folderPathBaseName = path.basename(folderPath),
        parentMetaFilePath = path.join(parentDir, '.meta.json'),
        metaFilePath = path.join(folderPath, '.meta.json');

    // check if test with same name exists when forceOverwrite is false
    if (!options.forceOverwrite) {
        dirUtils.assertDirectoryAbsence(folderPath);
    }

    // clean-up if directory already exists
    fs.rmSync(`${folderPath}`, { recursive: true, force: true });

    // check if folderPath's parent is already a collection folder
    dirUtils.assertCollectionDir(parentDir);

    // copy request, response, event files
    try {
        dirUtils.createDir(trimmedFolderPath);
    }
    catch (e) {
        console.error(`Could not create folder at ${folderPath}`);
        process.exit(-1);
    }

    // add new test to parent's .meta.json
    try {
        fs.accessSync(parentMetaFilePath, fs.constants.R_OK);
        let meta = JSON.parse(fs.readFileSync(parentMetaFilePath)),
            childrenOrder = meta.childrenOrder;

        if (!childrenOrder.includes(folderPathBaseName)) {
            childrenOrder.push(folderPathBaseName);
        }

        meta = {
            childrenOrder
        };

        dirUtils.createFile(parentMetaFilePath, JSON.stringify(meta, null, 2));
    }
    catch (e) {
        console.error(`Could not update ${parentMetaFilePath} with new request ${folderPath}: ${e}`);
        fs.rmSync(`${folderPath}`, { recursive: true, force: true });
        process.exit(-1);
    }

    // add .meta.json to new folder
    try {
        let meta = {
            childrenOrder: []
        };

        dirUtils.createFile(metaFilePath, JSON.stringify(meta, null, 2));
    }
    catch (e) {
        console.error(`Could not create ${metaFilePath} under new folder ${folderPath}: ${e}`);
        fs.rmSync(`${folderPath}`, { recursive: true, force: true });
        process.exit(-1);
    }
}

module.exports = {
    cliSetup,
    action
};
