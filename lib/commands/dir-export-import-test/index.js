const path = require('path');
const dirUtils = require('../dir-utils');
const assert = require('assert');
const fs = require('fs');
const commandUtil = require('../../../bin/util');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
module.exports = function (program) {
    program
        .command('dir-export-import-test <postman-collection-file>')
        .description('Check if an export followed by import results in same collection')
        .usage('<postman-collection-file>')
        .option('-s, --substitute-slashes', 'if slashes are found in name field - substitute them')
        .action((collectionFile, command) => {
            const collectionFilePath = collectionFile.startsWith('/') ?
                    collectionFile : path.join(process.cwd(), collectionFile),
                options = commandUtil.commanderToObject(command);

            let inputCollection = require(collectionFilePath),
                inputCollectionCloned,
                outputCollection = {},
                tempDir = dirUtils.createTempDir(),
                collectionDir;

            dirUtils.assertFileExistence(collectionFilePath);

            // handle different format postman collection file
            if (inputCollection.collection) {
                inputCollection = inputCollection.collection;
            }
            inputCollectionCloned = JSON.parse(JSON.stringify(inputCollection));

            collectionDir = inputCollection.info.name;

            try {
                // create export directory under a temporary directory
                process.chdir(tempDir);
                dirUtils.traverse(inputCollection, [], options);
            }
            catch (e) {
                console.error(e);
                fs.rmSync(tempDir, { recursive: true, force: true });
                process.exit(1);
            }

            dirUtils.assertDirectoryExistence(collectionDir);
            outputCollection = dirUtils.dirTreeToCollectionJson(collectionDir);
            // clean-up temp directory
            fs.rmSync(`./${collectionDir}`, { recursive: true, force: true });
            // console.log(`${JSON.stringify(inputCollection, null, 2)}`);
            // console.log(`${JSON.stringify(outputCollection, null, 2)}`);

            assert.deepStrictEqual(inputCollectionCloned, outputCollection);
        });
};
