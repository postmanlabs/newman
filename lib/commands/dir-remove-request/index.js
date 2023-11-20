const path = require('path'),
    fs = require('fs'),
    dirUtils = require('../dir-utils');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-remove-request <request-path>')
        .description('Remove request at given path from directory based Postman collection')
        .usage('<request-path> [options]');
}

function action (requestPath) {
    const parentDir = path.dirname(requestPath),
        requestPathBaseName = path.basename(requestPath),
        metaFilePath = path.join(parentDir, '.meta.json');

    // check if requestPath's parent is already a collection folder
    dirUtils.assertCollectionDir(parentDir);

    // remove directory
    try {
        fs.rmSync(requestPath, { recursive: true, force: true });
    }
    catch (e) {
        console.error(`Could not delete request at ${requestPath}, please check permissions`);
        process.exit(-1);
    }

    // remove request from parent's .meta.json
    try {
        fs.accessSync(metaFilePath, fs.constants.R_OK);
        let meta = JSON.parse(fs.readFileSync(metaFilePath)),
            childrenOrder = meta.childrenOrder;

        childrenOrder = childrenOrder.filter((item) => { return item !== requestPathBaseName; });

        meta = {
            childrenOrder
        };

        dirUtils.createFile(metaFilePath, JSON.stringify(meta, null, 2));
    }
    catch (e) {
        console.error(`Could not update ${metaFilePath} with ${requestPath} removed: ${e}`);
        fs.rmSync(requestPath, { recursive: true, force: true });
        process.exit(-1);
    }
}

module.exports = {
    cliSetup,
    action
};
