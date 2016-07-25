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
| `-e --environment <source>` | Specify an environment file path or URL. Environments provide a set of variables that one can use within collections. [Read More](https://www.getpostman.com/docs/environments) |
| `-g --globals <source>` | Specify file path or URL for global variables. |
| `-n --iteration-count <number>` | Specifies the number of times the collection has to be run when used in conjunction with iteration data file. |
| `-d --iteration-data <source>` | Specify a data source file (CSV) to be used for iteration. [Read More](https://www.getpostman.com/docs/multiple_instances) |
| `-d --timeout-request <ms>` | Specify the time (in milliseconds) to wait for requests to return a response. |
| `-k --insecure` | Disables SSL verification checks and allows self-signed SSL certificates. |
| `--folder [name]` | Run requests within a particular folder in a collection. |
| `--ignore-redirects` | Prevents newman from automatically following 3XX redirect responses. |
| `--no-color` | Turns off the usage of color in terminal output. |

<!--
| `-c --collection <source>` | TODO Specify a collection file path or URL. This is optional and any file or URL provided without options is treated as a collection. |
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




| `--reporters <cli|html>` | TODO |
| `--reporter-cli-view [result,summary,failures]` | TBD |
| `--reporter-html-template <path>` | TODO |
| `--reporter-html-output <path>` | TODO |

-->

Older command line options are supported, but are deprecated in favour of the newer v3 options and will soon be discontinued. For documentation on the older command options, refer to the README.md in latest v2.x release.

## Community Support

<img src="https://www.getpostman.com/img/v2/icons/slack.svg" align="right" />
If you are interested in talking to the team and other Newman users, we are there on <a href="https://www.getpostman.com/slack-invite" target="_blank">Slack</a>. Feel free to drop by and say hello. Our upcoming features and beta releases are discussed here along with world peace.

Get your invitation for Postman Slack Community from: <a href="https://www.getpostman.com/slack-invite">https://www.getpostman.com/slack-invite</a>.<br />
Already member? Sign in at <a href="https://postmancommunity.slack.com">https://postmancommunity.slack.com</a>

## License
This software is licensed under Apache-2.0. Copyright Postdot Technologies, Inc. See the [LICENSE.md](LICENSE.md) file for more information.

[![Analytics](https://ga-beacon.appspot.com/UA-43979731-9/newman/readme)](https://www.getpostman.com)
