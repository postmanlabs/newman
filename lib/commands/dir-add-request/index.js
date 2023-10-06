const commandUtil = require('../../../bin/util'),
    path = require('path'),
    fs = require('fs'),
    dirUtils = require('../dir-utils'),
    { Option } = require('commander');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
function cliSetup (program) {
    return program
        .command('dir-add-request <request-path>')
        .description('Add a request to directory based Postman collection in the given path')
        .usage('<request-path> [options]')
        .addOption(new Option('-t, --type <method>', 'HTTP Method template').choices(['GET', 'POST']).default('GET'))
        .option('-f, --force-overwrite', 'overwrite if request already exists', false);
}

function action (requestPath, command) {
    const options = commandUtil.commanderToObject(command),
        methodTemplateMap = {
            GET: path.join(__dirname, '/templates/GET template'),
            POST: path.join(__dirname, '/templates/POST body template')
        },
        parentDir = path.dirname(requestPath),
        trimmedTestPath = requestPath.replace(/\/+$/, ''),
        requestPathBaseName = path.basename(requestPath),
        metaFilePath = path.join(parentDir, '.meta.json');

    // check if request with same name exists when forceOverwrite is false
    if (!options.forceOverwrite) {
        dirUtils.assertDirectoryAbsence(requestPath);
    }

    // check if requestPath's parent is already a collection folder
    dirUtils.assertCollectionDir(parentDir);

    // copy request, response, event files
    try {
        fs.cpSync(methodTemplateMap[options.type],
            trimmedTestPath,
            { recursive: true });
    }
    catch (e) {
        console.error(`Could not copy from template at ${methodTemplateMap[options.type]}`);
        fs.rmSync(`${requestPath}`, { recursive: true, force: true });
        process.exit(-1);
    }

    // add new request to parent's .meta.json
    try {
        fs.accessSync(metaFilePath, fs.constants.R_OK);
        let meta = JSON.parse(fs.readFileSync(metaFilePath)),
            childrenOrder = meta.childrenOrder;

        if (!childrenOrder.includes(requestPathBaseName)) {
            childrenOrder.push(requestPathBaseName);
        }

        meta = {
            childrenOrder
        };

        dirUtils.createFile(metaFilePath, JSON.stringify(meta, null, 2));
    }
    catch (e) {
        console.error(`Could not update ${metaFilePath} with new request ${requestPath}: ${e}`);
        fs.rmSync(`${requestPath}`, { recursive: true, force: true });
        process.exit(-1);
    }
}

module.exports = {
    cliSetup,
    action
};
