const commands = [
    'dir-add-folder',
    'dir-add-test',
    'dir-create',
    'dir-export',
    'dir-export-import-test',
    'dir-import',
    'dir-remove-folder',
    'dir-remove-test',
    'dir-run',
    'run'
];

commands.forEach(function (value) {
    module.exports[value] = require('./' + value);
});
