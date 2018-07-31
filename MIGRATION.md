# Newman

## Why?

Newman v4.0 has major breaking changes which will affect you if you are using deprecated CLI options or running Newman on Node v4.
It drops support for Node v4 and deprecated v2 CLI options. Also, inbuilt HTML reporter is moved to a standalone reporter.

## Updating to Newman v4 from older versions

If you're updating from an existing version of Newman, make sure you read the rest of this document, to understand the changes.

#### 1. Install Newman v4
```console
$ npm install -g newman  # Install newman globally
```

#### 2. Check Installation
```console
$ newman --version  # Should show the latest version of Newman
```

## V3 to V4 migration guide:

### Upgrading Node.js
Newman v4 requires Node.js >= v6. [Install Node.js via package manager](https://nodejs.org/en/download/package-manager/).

### Discontinued CLI Options
Newman v4 drops support for all the deprecated v2 CLI options, check [Newman v2 to v3 migration guide](https://github.com/postmanlabs/newman/blob/release/3.x/MIGRATION.md#cli).<br/>
For the complete list of supported options, see the [README](README.md)

### Using HTML Reporter
The inbuilt HTML reporter has been moved to a standalone reporter. Install it with:
```console
$ npm install -g newman-reporter-html
```
Installation should be global if newman is installed globally, local otherwise. (Remove `-g` flag from the above command for a local installation.)

The complete installation and usage guide is available here: https://github.com/postmanlabs/newman-reporter-html

### CSV auto parse
A [fix](1609) has been made to avoid parsing numbers inside quotes.<br/>
So, `"000123"` will not be parsed to `123` like before.

Fixes issues: [#1100](1100), [#1215](1215) & [#1346](1346)

### Default timeouts
The default timeout values are changed from 0 to infinity.<br/>
A [fix](1630) has been made to fix the issue [#1626](1626).
