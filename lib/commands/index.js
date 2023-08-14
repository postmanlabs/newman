const commands = [
    'run',
    'dir-add-test',
    'dir-export',
    'dir-export-import-test',
    'dir-import',
    'dir-remove-test',
    'dir-run'
];

commands.forEach(function (value) {
    module.exports[value] = require('./' + value);
});
