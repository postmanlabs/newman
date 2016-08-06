# Options to be supported

#### Options for the Run Command:
    // not needed. added --reporter-no-summary
    runParser.addArgument(['--no-summary'], {
        help: 'Does not print summary for each iteration.',
        action: 'storeTrue'
    });

    runParser.addArgument(['-s', '--stop-on-error'], {
        help: 'Stops the runner with non-zero exit code when a test case fails',
        action: 'storeTrue'
    });

#### Generic options which apply throughout Newman:

    commonParser.addArgument(['--verbose'], {
        help: 'Enable verbose output.',
        action: 'storeTrue'
    });

    commonParser.addArgument(['--disable-unicode'], {
        help: 'Disables unicode characters in the console.',
        action: 'storeTrue'
    });

#### Options specific to single Newman requests

    requestOptionsParser.addArgument(['--delay'], {
        help: 'Specify a delay between requests (in milliseconds).',
        type: Number
    });

    requestOptionsParser.addArgument(['--tls'], {
        help: 'Only use TLSv1',
        action: 'storeTrue'
    });

    requestOptionsParser.addArgument(['--encoding'], {
        help: 'Specify an encoding for the response.',
        choices: ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex']
    });

#### Older Execute options

    parser.addArgument(['-y', '--delay'], {
        help: 'Specify a delay (in ms) between requests',
        type: Number
    });

    parser.addArgument(['-j', '--noSummary'], {
        help: 'Doesn\'t show the summary for each iteration',
        action: 'storeTrue'
    });

    parser.addArgument(['-C', '--noColor'], {
        help: 'Disable colored output',
        action: 'storeTrue'
    });

    parser.addArgument(['-S', '--noTestSymbols'], {
        help: 'Disable symbols in test output and use PASS|FAIL instead',
        action: 'storeTrue'
    });

    parser.addArgument(['-l', '--tls'], {
        help: 'Use TLSv1',
        action: 'storeTrue',
        defaultValue: false
    });

    parser.addArgument(['-N', '--encoding'], {
        help: 'Specify an encoding for the response.',
        choices: ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex']
    });

    parser.addArgument(['-o', '--outputFile'], {
        help: 'Path to file where output should be written.'
    });

    parser.addArgument(['-O', '--outputFileVerbose'], {
        help: 'Path to file where full request and responses should be logged.'
    });

    parser.addArgument(['-t', '--testReportFile'], {
        help: 'Path to file where results should be written as JUnit XML.'
    });

    // todo: implement support for this.
    parser.addArgument(['-i', '--import'], {
        help: 'Import a Postman backup file, and save collections, environments, and globals.'
    });
    parser.addArgument(['-p', '--pretty'], {
        help: 'Enable pretty-print while saving imported collections, environments, and globals.'
    });

    parser.addArgument(['-W', '--whiteScreen'], {
        help: 'Black text for white screen',
        action: 'storeTrue',
        defaultValue: false
    });

    parser.addArgument(['-L', '--recurseLimit'], {
        help: 'Do not run recursive resolution more than [limit] times. Default = 10. Using 0 will prevent any variable resolution.',
        type: Number
    });

    exitMethodGroup.addArgument(['-s', '--stopOnError'], {
        help: 'Stops the runner with non-zero exit code when a test case fails',
        action: 'storeTrue',
        defaultValue: true
    });

    exitMethodGroup.addArgument(['-x', '--exitCode'], {
        help: 'Continue running tests even after a failure, but exit with code=1.',
        action: 'storeTrue',
        defaultValue: false
    });
