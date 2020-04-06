const TEST_TYPE = ((argv) => {
        let match = argv[argv.length - 1].match(/npm\/test-(\w+).js/);

        return match && match[1] || '';
    })(process.argv);

function configOverrides (testType) {
    switch (testType) {
        case 'unit':
            return {
                branches: 60,
                lines: 75,
                functions: 80,
                statements: 75
            };
        case 'library':
            return {
                branches: 40,
                lines: 60,
                functions: 55,
                statements: 55
            };
        case 'integration':
            return {
                branches: 20,
                lines: 40,
                functions: 40,
                statements: 40
            };
        case 'cli':
            return {
                branches: 65,
                lines: 80,
                functions: 80,
                statements: 80
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
