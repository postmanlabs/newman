const path = require('path'),
    fs = require('fs'),
    dirUtils = require('../dir-utils');

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
    const parentDir = path.dirname(folderPath),
        folderPathBaseName = path.basename(folderPath),
        metaFilePath = path.join(parentDir, '.meta.json');

    // check if folderPath's parent is already a collection folder
    dirUtils.assertCollectionDir(parentDir);

    // remove directory
    try {
        fs.rmSync(folderPath, { recursive: true, force: true });
    }
    catch (e) {
        console.error(`Could not delete folder at ${folderPath}, please check permissions`);
        process.exit(-1);
    }

    // remove folder from parent's .meta.json
    try {
        fs.accessSync(metaFilePath, fs.constants.R_OK);
        let meta = JSON.parse(fs.readFileSync(metaFilePath)),
            childrenOrder = meta.childrenOrder;

        childrenOrder = childrenOrder.filter((item) => { return item !== folderPathBaseName; });

        meta = {
            childrenOrder
        };

        dirUtils.createFile(metaFilePath, JSON.stringify(meta, null, 2));
    }
    catch (e) {
        console.error(`Could not update ${metaFilePath} with ${folderPath} removed: ${e}`);
        fs.rmSync(folderPath, { recursive: true, force: true });
        process.exit(-1);
    }
}

module.exports = {
    cliSetup,
    action
};
