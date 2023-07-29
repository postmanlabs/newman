const commands = [
    'run',
    'dir-add-test',
    'dir-export',
    'dir-import',
    'dir-run'
];

commands.forEach(function (value) {
    module.exports[value] = require('./' + value);
});
