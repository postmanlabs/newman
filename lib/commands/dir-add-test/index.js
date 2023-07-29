/*
    @param {Command} - An commander Command instance to which this command is added
*/
module.exports = function (program) {
    program
        .command('dir-add-test <test-name>')
        .description('add a test to directory based postman collection')
        .usage('<test-name> [options]')
        .action((collection, command) => {
            console.error(`${command} for ${collection} not implemented yet`);
        });
};
