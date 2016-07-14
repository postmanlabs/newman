# Options to be supported

#### Options for the Run Command:

    runParser.addArgument(['-f', '--folder'], {
        help: 'Run a single folder from a collection.'
    });

    runParser.addArgument(['--export-environment'], {
        help: 'Exports the environment to a file after completing the run.'
    });

    runParser.addArgument(['--export-globals'], {
        help: 'Specify an output file to dump Globals before exiting'
    });

    runParser.addArgument(['--no-summary'], {
        help: 'Does not print summary for each iteration.',
        action: 'storeTrue'
    });

    runParser.addArgument(['-s', '--stop-on-error'], {
        help: 'Stops the runner with non-zero exit code when a test case fails',
        action: 'storeTrue'
    });

    runParser.addArgument(['-d', '--data'], {
        help: 'Specify a data file to use for iterations (either json or csv).'
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

    requestOptionsParser.addArgument(['--request-timeout'], {
        help: 'Specify a timeout for requests (in milliseconds).',
        type: Number
    });

    requestOptionsParser.addArgument(['--avoid-redirects'], {
        help: 'If present, Newman will not follow HTTP Redirects.',
        action: 'storeTrue'
    });

    requestOptionsParser.addArgument(['-k', '--insecure'], {
        help: 'Disables SSL validations.',
        action: 'storeTrue'
    });

    requestOptionsParser.addArgument(['--tls'], {
        help: 'Only use TLSv1',
        action: 'storeTrue'
    });

    requestOptionsParser.addArgument(['--encoding'], {
        help: 'Specify an encoding for the response.',
        choices: ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex']
    });

