<a href="https://www.getpostman.com/"><img src="https://raw.githubusercontent.com/postmanlabs/postmanlabs.github.io/develop/global-artefacts/postman-logo%2Btext-320x132.png" /></a><br />
_Supercharge your API workflow<br/>Modern software is built on APIs. Postman helps you develop APIs faster._

# newman <sub>_the cli companion for postman_</sub>

Using Newman one can effortlessly run and test a Postman Collections directly from the command-line. It is built with
extensibility in mind so that you can easily integrate it with your continuous integration servers and build systems.

> *BETA RELEASE NOTES*
>
> To use newan v3.x beta, ensure that you install using the beta tag: `npm install newman@next`.
>
> The beta version of `newman v3.x` is currently under development and is not intended for production use. Details
> outlining the limitations and roadmap of newman v3.x is outlined in [BETA.md](BETA.md).

> To view documentation of current stable 2.x release of Newman, refer to the latest [newman v2.x release](https://github.com/postmanlabs/newman/tree/v2.1.2)


## Getting started

Newman is built using NodeJS v4+. To run Newman, make sure you have NodeJS version 4 or above installed. The latest
version of NodeJS can be easily installed by following instructions mentioned at
[https://nodejs.org/en/download/package-manager/](https://nodejs.org/en/download/package-manager/).

The easiest way to install Newman is using NPM. If you have NodeJS installed, it is most likely that you have NPM
installed as well.

```terminal
$ npm install newman --global;
```

The `newman run` command allows you to specify a collection to be run. You can easily export your Postman
Collection as a json file from the Postman App and run it using Newman.

```terminal
$ newman run examples/sample-collection.json;
```

If your collection file is available as an URL (such as from our [Cloud API service](https://api.getpostman.com/)),
Newman can fetch youir file and run it as well.
```terminal
$ newman run https://www.getpostman.com/collections/631643-f695cab7-6878-eb55-7943-ad88e1ccfd65-JsLv;
```

For the whole list of options refer to the Commandline Options section below.

### Using Newman programmatically as a NodeJS module

Newman can be easily used within your JavaScript projects as a NodeJS module. All functionalities of the newman command line is available for programmatic use as well.

The following example runs a collection by reading a JSON collection file stored on disk.

```javascript
var newman = require('newman'); // require newman in your project

// call newman.run to pass `options` object and wait for callback
newman.run({
    collection: require('./sample-collection.json'),
    reporters: 'cli'
}, function (err) {
	if (err) { throw err; }
    console.log('collection run complete!');
});
```

The newman v2.x `.execute` function has been deprecated and will be discontinued in future.

## Commandline Options

### `newman run <collection-file-source> [options]`

| Option | Description |
|--------|-------------|
| `-e --environment <source>` | Specify an environment file path or URL |
| `-g --globals <source>` | Specify file path or URL for global variables |
| `-c --collection <source>` | Specify a collection file path or URL |
| `--timeout-request <ms>` | Specify the timeout for requests to return a response |
| `-k --insecure` | Prevents SSL verification and allows self-signed SSL certificates |
| `--folder [name]` | Run requests within a particular folder in a collection |

<!--

| `-x --suppress-exitcode` | TODO |
| `--silent` | TODO |
| `--verbose` | TODO |

| `--timeout-run <ms>` | TODO |
| `--timeout-script <ms>` | TODO |

| `--delay-run <ms>` | TODO |
| `--delay-iteration <ms>` | TODO |
| `--delay-request <ms>` | TODO |

| `--stop-on [error,test]` | TBD |

| `--export <directory>` | TBD |
| `--export-environment <path>` | TODO |
| `--export-globals <path>` | TODO |
| `--export-collection <path>` | TODO |
| `--export-pretty` | TODO |

| `--ignore-redirects` | TODO Prevents newman from following 3XX redirect response |

| `--iteration-count <number>` | Specifies the number of times the collection has to be run<br />when used in conjunction with iteration data file. |
| `--iteration-data <source>` | TODO |

| `--reporters <cli|html>` | TODO |
| `--reporter-cli-view [result,summary,failures]` | TBD |
| `--reporter-html-template <path>` | TODO |
| `--reporter-html-output <path>` | TODO |

-->

Older command line options are supported, but are deprecated in favour of the newer v3 options and will soon be discontinued. For documentation on the older command options, refer to the README.md in latest v2.x release.
