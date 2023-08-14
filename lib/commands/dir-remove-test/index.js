const path = require('path'),
    fs = require('fs'),
    dirUtils = require('../dir-utils');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
module.exports = function (program) {
    program
        .command('dir-remove-test <test-path>')
        .description('Remove test at given path from directory based Postman collection')
        .usage('<test-path> [options]')
        .action((testPath) => {
            const parentDir = path.dirname(testPath),
                testPathBaseName = path.basename(testPath),
                metaFilePath = path.join(parentDir, '.meta.json');

            // check if testPath's parent is already a collection folder
            dirUtils.assertCollectionDir(parentDir);

            // copy request, response, event files
            try {
                fs.rmSync(testPath, { recursive: true, force: true });
            }
            catch (e) {
                console.error(`Could not delete test at ${testPath}, please check permissions`);
                process.exit(-1);
            }

            // remove test from parent's .meta.json
            try {
                fs.accessSync(metaFilePath, fs.constants.R_OK);
                let meta = JSON.parse(fs.readFileSync(metaFilePath)),
                    childrenOrder = meta.childrenOrder;

                childrenOrder = childrenOrder.filter((item) => { return item !== testPathBaseName; });

                meta = {
                    childrenOrder
                };

                dirUtils.createFile(metaFilePath, JSON.stringify(meta, null, 2));
            }
            catch (e) {
                console.error(`Could not update ${metaFilePath} with ${testPath} removed: ${e}`);
                fs.rmSync(testPath, { recursive: true, force: true });
                process.exit(-1);
            }
        });
};
