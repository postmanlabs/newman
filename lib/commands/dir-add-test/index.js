const commandUtil = require('../../../bin/util'),
    path = require('path'),
    fs = require('fs'),
    dirUtils = require('../dir-utils'),
    { Option } = require('commander');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
module.exports = function (program) {
    program
        .command('dir-add-test <test-path>')
        .description('Add a test to directory based Postman collection in the given path')
        .usage('<test-path> [options]')
        .addOption(new Option('-t, --type <method>', 'HTTP Method template').choices(['GET', 'POST']).default('GET'))
        .option('-f, --force-overwrite', 'overwrite if test already exists', false)
        .action((testPath, command) => {
            const options = commandUtil.commanderToObject(command),
                methodTemplateMap = {
                    GET: './lib/commands/dir-add-test/templates/GET template',
                    POST: './lib/commands/dir-add-test/templates/POST body template'
                },
                parentDir = path.dirname(testPath),
                trimmedTestPath = testPath.replace(/\/+$/, ''),
                testPathBaseName = path.basename(testPath),
                metaFilePath = path.join(parentDir, '.meta.json');


            // check if test with same name exists when forceOverwrite is false
            if (!options.forceOverwrite) {
                dirUtils.assertDirectoryAbsence(testPath);
            }

            // check if testPath's parent is already a collection folder
            dirUtils.assertCollectionDir(parentDir);

            // copy request, response, event files
            try {
                fs.cpSync(methodTemplateMap[options.type],
                    trimmedTestPath,
                    { recursive: true });
            }
            catch (e) {
                console.error(`Could not copy from template at ${methodTemplateMap[options.type]}`);
                fs.rmSync(`${testPath}`, { recursive: true, force: true });
                process.exit(-1);
            }

            // add new test to parent's .meta.json
            try {
                fs.accessSync(metaFilePath, fs.constants.R_OK);
                let meta = JSON.parse(fs.readFileSync(metaFilePath)),
                    childrenOrder = meta.childrenOrder;

                if (!childrenOrder.includes(testPathBaseName)) {
                    childrenOrder.push(testPathBaseName);
                }

                meta = {
                    childrenOrder
                };

                dirUtils.createFile(metaFilePath, JSON.stringify(meta, null, 2));
            }
            catch (e) {
                console.error(`Could not update ${metaFilePath} with new request ${testPath}: ${e}`);
                fs.rmSync(`${testPath}`, { recursive: true, force: true });
                process.exit(-1);
            }
        });
};
