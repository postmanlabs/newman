const path = require('path');
const dirUtils = require('../dir-utils');

/*
    @param {Command} - An commander Command instance to which this command is added
*/
module.exports = function (program) {
    program
        .command('dir-export <postman-collection-file>')
        .description('convert a postman collection file into its directory representation')
        .usage('<postman-collection-file> [options]')
        .action((collectionFile) => {
            let collectionFilePath = collectionFile.startsWith('/') ?
                collectionFile : path.join(process.cwd(), collectionFile);

            dirUtils.assertFileExistence(collectionFilePath);

            let collection = require(collectionFilePath);

            // handle different format postman collection file
            if (collection.collection) {
                collection = collection.collection;
            }

            dirUtils.traverse(collection, []);
            process.exit(0);
        });
};
