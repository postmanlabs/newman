# Newman

## Why?

Newman v3.0 is a complete rewrite of Newman from the ground up, which works well with other Node libraries, and
allows flexibility for future features such as parallel collection runs, or performing parallel requests within the
same run. Above all, Newman now uses [Postman Runtime](https://github.com/postmanlabs/postman-runtime/) in order to
provide a consistent experience on Postman Apps and on CLI.

## General overview of features

0. Newman collection runs now happen with the `run` command. See sections below for more examples.
1. More informative terminal output with colourful details of what went wrong, and most importantly, where it went
   wrong.
2. Ability to load environment, globals, collections as well as iteration data from urls.
3. Friendlier usage as a library. A lot of use-cases depend on the use of Newman as a Node library, and v3.0 is written
   with a library-first mindset.
4. Internally things (by things, we usually mean code) have been better organised to allow faster implementation of
   features.

## Todo

It is still a work in progress, so there are a few features that are pending
implementation:

1. Make generic and uncaught exceptions more readable in CLI

## Updating to Newman v3 from older versions

If you're updating from an existing version of Newman, make sure you read the rest of this document, to understand 
the changes.

##### 1. Remove the existing version of Newman
```terminal
$ npm uninstall -g newman
```

##### 2. Install Newman v3
```terminal
$ npm install -g newman  # Install newman globally
```

##### 3. Check Installation
```terminal
$ newman --version  # Should show the latest version of Newman
```

## Changes since v2.x

Migrating to Newman v3.x for most simple use cases is a trivial affair. We have taken care to support older CLI options.
Which means, if you upgrade, it should just work! Having said that, we would soon discontinue the older CLI options and
you should start using the new ones. Furthermore, the new features are only available via the new CLI options.

Since Newman 3.x is a complete rewrite, expect it to have subtle behavioural differences when compared with Newman v2.x,
your reports will look a bit different, the CLI output is a complete overhaul, your collection runs will inherit all the
qualities of the new Postman Runtime (jQuery deprecation, discontinuation of DOM), etc. For a comprehensive list of
usage changes across Newman V2 and V3, look at the table provided below.

As such, if there is something specific that not working with respect to v2.x or any workaround that you were doing,
we will be glad to chat and find out if they can still be done. Simply join the #newman channel on our [Slack
Community](https://www.getpostman.com/slack-invite).

### HTML, XML and other outputs are now "reporters"
Newman v3 adopts a "reporter" model and as such features that were previously part of Newman core has now been moved
into reporters. Consequently, the CLI options for these features are now accessible via `--reporter-*` options. You
might also notice that some of the functionalities of reporters have been reduced even though the reporter outputs have
become more detailed. This is to offload non-essential codebase away from Newman core and be later made pluggable into
external reporter plugins.

### --no-color is automated
Newman now automatically detects lack of colour support and as such this flag does not need to be explicitly provided
any more. However, `--no-color` is still available to force not to use colors in terminal output.

### Discontinued CLI Options

#### -S --noTestSymbols
This switch no longer has any effect. Newman v3 effectively handles unicode output on Windows Platform.

#### -p, --pretty
This switch used to render exported JSON files in newman v2 in a pretty format. Newman v3 always exports in pretty
format and as such, this switch is now not needed. If you want to use compressed export formats, run the exported files
through some JSON minifier.

## V2 to V3 migration guide:

The following tables enumerate the options that have either been deprecated / discontinued, or renamed in Newman V3. The
V3 equivalents provided in the second column are intended for use with the `run` command (described below), and will not
work in V2 mode. The original options from V2, still work (without `run`, of course) however, but will be removed in the
next major Newman release.

In the V2 option status column, deprecated implies that the corresponding CLi option has been left for backward
compatibility and will be removed in the next major Newman release. A status of discontinued implies that the option is
no longer supported, or is implemented by default.

Options missing from the migration tables have been left as they were from Newman V2. For the complete list of supported
options, see [README.md](README.md)

### CLI

#### Sample use cases

##### 1. A collection run with all basic options configured, excluding reporter actions

###### V2 command
```terminal
newman --collection collection.json --environment env.json --data data.csv --globals globals.json --number 2 --exportGlobals globalOut.json --exportEnvironment envOut.json --delay 10 --requestTimeout 5000 --noTestSymbols --tls --exitCode --whiteScreen --avoidRedirects --stopOnError
```
###### V3 equivalent
```terminal
newman run collection.json --environment env.json --iteration-data data.csv --globals globals.json --iteration-count 2 --export-globals globalOut.json --export-environment envOut.json --delay-request 10 --timeout-request 5000 --disable-unicode --suppress-exit-code --ignore-redirects --bail
```

##### 2. A collection run with various reporter tasks

###### V2 command
```terminal
newman --url https://a.com/collection.json --environment-url https://a.com/env.json --noColor --outputFile jsonOut.json --testReportFile xmlOut.xml --html htmlOutput.html --outputFileVerbose verboseOut.log
```
###### V3 equivalent
```terminal
newman run https://a.com/collection.json --environment https://a.com/env.json --reporters cli,html,json,junit --reporter-json-export jsonOut.json --reporter-junit-export xmlOut.xml --reporter-html-export htmlOutput.html
```

#### CLI migration table
| V2 CLI option | V3 equivalent | V2 option Status |
|---------------|---------------|------------------|
| -c --collection | N.A | Deprecated (Pass the collection file path without the collection flag) |
| -u --url | N.A | Deprecated (Pass the collection file URL without the collection flag) |
| --environment-url | N.A | Deprecated (Pass the environment file URL to -e --environment) |
| -f --folder | --folder | Deprecated. The V3 folder option has been reduced to --folder |
| -d --data | -d --iteration-data | Deprecated |
| -n --number | -n --iteration-count | Deprecated |
| -i --import | N.A | Deprecated |
| -p --pretty | N.A | Discontinued |
| -G --exportGlobals | --export-globals | Deprecated |
| -E --exportEnvironment | --export-environment | Deprecated |
| -y --delay | --delay-request | Deprecated |
| -r --requestTimeout | --timeout-request | Deprecated |
| -s --stopOnError | --bail | Deprecated |
| -j --noSummary | --reporter-cli-no-summary | Deprecated |
| -C --noColour | --no-color | Deprecated |
| -S --noTestSymbols | --disable-unicode | **Discontinued** |
| -l --tls | N.A | **Discontinued** |
| -x --exitCode | -x --suppress-exit-code | Deprecated (The V3 option takes no arguments, and forces an exit code of 0)|
| -w --whiteScreen | N.A | **Discontinued** |
| -o --outputFile | --reporter-json-export | Deprecated |
| -t --testReportFile | --reporter-junit-export | Deprecated |
| -H --html | --reporter-html-export | Deprecated |
| -O --outputFileVerbose | N.A | **Discontinued** |
| -R --avoidRedirects | --ignore-redirects | Deprecated |

### Library usage

#### Sample use cases

##### 1. A collection run with all basic options configured, excluding reporter actions

###### V2 command
```javascript
newman.execute({
    collection: 'collection.json',
    environment: 'env.json',
    data: 'data.csv',
    globals: 'globals.json',
    number: 2,
    exportGlobals: 'globalOut.json',
    exportEnvironment: 'envOut.json',
    delay: 10,
    stopOnError: true,
    requestTimeout: 5000,
    noTestSymbols: true,
    tls: true,
    exitCode: true,
    whiteScreen: true,
    avoidRedirects: true
}, callback);
```

###### V3 equivalent
```javascript
newman.run({
    collection: 'collection.json',
    environment: 'env.json',
    iterationData: 'data.csv',
    globals: 'globals.json',
    iterationCount: 2,
    exportGlobals: 'globalOut.json',
    exportEnvironment: 'envOut.json',
    delayRequest: 10,
    bail: true,
    timeoutRequest: 5000,
    disableUnicode: true,
    suppressExitCode: true,
    ignoreRedirects: true
}, callback);
```

##### 2 A collection run with various reporter tasks

###### V2 command
```javascript
newman.execute({
    collection: 'https://a.com/collection.json',
    environment: {
        "id": "my-id",
        "name": "testEnv",
        "values": [
            {
                "key": "env",
                "value": "env2",
            },
            {
                "key": "data",
                "value": "env2",
            }
        ]
    },
    globals: [
        {
            key: "var1",
            value: "/get",
            enabled: true
        },
        {
            key: "var2",
            value: "Global Bar",
        }
    ],
    outputFile: 'jsonOut.json',
    testReportFile: 'xmlOut.xml',
    html: 'htmlOutput.html',
    outputFileVerbose: 'verboseOut.log'
}, callback);
```

###### V3 equivalent
```javascript
newman.run({
    collection: 'https://a.com/collection.json',
    environment: {
        "id": "my-id",
        "name": "testEnv",
        "values": [
            {
             "key": "env",
             "value": "env2",
            },
            {
             "key": "data",
             "value": "env2",
            }
        ]
    },
    iterationData: [ {a: 1}, {a: 2} ],
    globals: [
        {
            key: "var1",
            value: "/get",
            enabled: true
        },
        {
            key: "var2",
            value: "Global Bar",
        }
    ],
    reporters: ['html', 'junit', 'json'],
    reporter: {
        html: {
            export: 'htmlOutput.html'
        },
        junit: {
            export: 'xmlOut.xml'
        },
        json: {
            export: 'jsonOut.json'
        }
    }
}, callback);
```

#### Library migration table
| V2 `options` | V3 equivalent | V2 option Status |
|---------------|---------------|------------------|
| data | iterationData | Deprecated |
| number | iterationCount | Deprecated |
| delay | delayRequest | Deprecated |
| requestTimeout | timeoutRequest | Deprecated |
| noTestSymbols | disableUnicode | **Discontinued** |
| stopOnError | bail | Deprecated |
| exitCode | suppressExitCode | Deprecated |
| avoidRedirects | ignoreRedirects | Deprecated |
