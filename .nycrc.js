const TEST_TYPE = ((argv) => {
        let match = argv[argv.length - 1].match(/npm\/test-(\w+).js/);

        return match && match[1] || '';
    })(process.argv);

function configOverrides (testType) {
    switch (testType) {
        case 'cli':
            return {
                statements: 82,
                branches: 67,
                functions: 86,
                lines: 83
            };
        case 'integration':
            return {
                statements: 35,
                branches: 20,
                functions: 35,
                lines: 35,
                // since integration tests only test collection-runs
                exclude: ['lib/crypt.js', 'lib/login', 'lib/config', 'lib/logout']
            };
        case 'library':
            return {
                statements: 57,
                branches: 40,
                functions: 56,
                lines: 57,
                // since these features are only for cli-run
                exclude: ['lib/crypt.js', 'lib/login', 'lib/config', 'lib/logout']
            };
        case 'unit':
            return {
                statements: 72,
                branches: 56,
                functions: 74,
                lines: 73
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
