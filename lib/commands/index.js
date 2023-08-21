const commands = [
    'dir-add-test',
    'dir-export',
    'dir-export-import-test',
    'dir-import',
    'dir-remove-test',
    'dir-run',
    'run'
];

commands.forEach(function (value) {
    module.exports[value] = require('./' + value);
});
