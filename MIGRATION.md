# Newman

## Why?

Newman v4.0 has major breaking changes which might affect you if you using deprecated CLI options or running Newman on Node v4.
It drops support for Node v4 and deprecated v2 CLI options. Also, inbuilt HTML reporter is moved to a standalone reporter.

## Updating to Newman v4 from older versions

If you're updating from an existing version of Newman, make sure you read the rest of this document, to understand the changes.

#### 1. Remove the existing version of Newman
```console
$ npm uninstall -g newman
```

#### 2. Install Newman v4
```console
$ npm install -g newman  # Install newman globally
```

#### 3. Check Installation
```console
$ newman --version  # Should show the latest version of Newman
```

## V3 to V4 migration guide:

#### Upgrading Node.js
Newman v4 requires Node.js >= v6. [Install Node.js via package manager](https://nodejs.org/en/download/package-manager/).

#### Discontinued CLI Options
Newman v4 drops support for all the deprecated v2 CLI options, check [Newman v2 to v3 migration guide](https://github.com/postmanlabs/newman/blob/release/3.x/MIGRATION.md#cli).

For the complete list of supported options, see [README.md](README.md)

#### Using HTML Reporter
The inbuilt HTML reporter is moved to a standalone reporter which can be installed via:
```console
$ npm install -g newman-reporter-html
```
Installation should be global if newman is installed globally, local otherwise. (Remove `-g` flag from the above command for a local installation.)

The complete installation and usage guide is available at [newman-reporter-html](https://github.com/postmanlabs/newman-reporter-html#readme).
