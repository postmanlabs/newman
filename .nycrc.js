const TEST_TYPE = ((argv) => {
    let match = argv[argv.length - 1].match(/npm\/test-(\w+).js/);

    return match && match[1] || '';
})(process.argv);

function configOverrides (testType) {
    switch (testType) {
        case 'cli':
            return {
                statements: 80,
                branches: 65,
                functions: 85,
                lines: 80
            };
        case 'integration':
            return {
                statements: 40,
                branches: 20,
                functions: 40,
                lines: 40
            };
        case 'library':
            return {
                statements: 55,
                branches: 40,
                functions: 55,
                lines: 55
            };
        case 'unit':
            return {
                statements: 70,
                branches: 55,
                functions: 80,
                lines: 70
            };
        default:
            return {}
    }
}

module.exports = {
    all: true,
    'check-coverage': true,
    'report-dir': '.coverage',
    'temp-dir': '.nyc_output',
    include: ['lib/**/*.js', 'bin/**/*.js'],
    reporter: ['lcov', 'json', 'text', 'text-summary'],
    ...configOverrides(TEST_TYPE),
};
