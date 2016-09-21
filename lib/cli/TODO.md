# Options to be supported

#### Generic options which apply throughout Newman:

    commonParser.addArgument(['--verbose'], {
        help: 'Enable verbose output.',
        action: 'storeTrue'
    });

#### Older Execute options

    // todo: implement support for this.
    parser.addArgument(['-i', '--import'], {
        help: 'Import a Postman backup file, and save collections, environments, and globals.'
    });
