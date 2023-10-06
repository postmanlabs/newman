const commands = [
    'dir-add-folder',
    'dir-add-request',
    'dir-create',
    'dir-export',
    'dir-export-import-test',
    'dir-import',
    'dir-remove-folder',
    'dir-remove-request',
    'dir-run',
    'run'
];

commands.forEach(function (value) {
    module.exports[value] = require('./' + value);
});
