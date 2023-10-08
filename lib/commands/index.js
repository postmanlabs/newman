const commands = [
    'dir-add-folder',
    'dir-add-request',
    'dir-collection-create',
    'dir-export',
    'dir-export-import-check',
    'dir-import',
    'dir-remove-folder',
    'dir-remove-request',
    'dir-run',
    'run'
];

commands.forEach(function (value) {
    module.exports[value] = require('./' + value);
});
