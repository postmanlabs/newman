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

- `-e <source>`, `--environment <source>`<br />
  Specify an environment file path or URL. Environments provide a set of variables that one can use within collections.
  [Read More](https://www.getpostman.com/docs/environments)

- `-g <source>`, `--globals <source>`<br />
  Specify file path or URL for global variables. Global variables are similar to environment variables but has a lower
  precedence and can be overridden by environment variables having same name.

- `-n <number`, `--iteration-count <number>`<br />
  Specifies the number of times the collection has to be run when used in conjunction with iteration data file.<br />
  <br />

- `-d <source>`, `--iteration-data <source>`<br />
  Specify a data source file (CSV) to be used for iteration.
  [Read More](https://www.getpostman.com/docs/multiple_instances)

- `--timeout-request <ms>`<br />
  Specify the time (in milliseconds) to wait for requests to return a response.

- `-k --insecure`<br />
  Disables SSL verification checks and allows self-signed SSL certificates.

- `--folder <name>`<br />
  Run requests within a particular folder in a collection.

- `--ignore-redirects`<br />
  Prevents newman from automatically following 3XX redirect responses.

- `--no-color`<br />
  Newman attempts to automatically turn off color output to terminals when it detects the lack of color support. With
  this property, one can forcibly turn off the usage of color in terminal output for reporters and other parts of Newman
  that output to console.

#### Configuring Reporters

- `--reporters <name>`<br />
  Specify one reporter name as `string` or provide more than one reporter name as an `array`.Available reporters are:
  `cli`, `html` and `junit`.


- `--reporter-{{reporter-options}}<br />
  Since newman accepts one or more reporters as part of its arguments, reporter specific onfigurations are provided with
  `--reporter-` prefix. When multiple reporters are provided, these options are passed to all the reporters.<br /<br />
  For example, `... --reporters cli,html --reporter-silent` passes the `silent: true` option to both HTML and CLI
  reporter.

- `--reporter-{{reporter-name}}-{{reporter-options}}<br />
  When multiple reporters are provided, if one needs to specifically override or provide an option to one reporter, this
  is achieved by prefixing the option with `--reporter-{{reporter-name}}-`.<br /><br />
  For example, `... --reporters cli,html --reporter-cli-silent` makes only the CLI reporter as silent

##### CLI reporter options
These options are supported by the CLI reporter, use them with appropriate argument switch prefix. For example, the
option `no-summary` can be passed as `--reporter-no-summary` or `--reporter-cli-no-summary`.

| Option      | Description |
|-------------|-------------|
| silent      | The CLI reporter is internally disabled and you see no output to terminal. |
| no-summary  | The statstical summary table is not shown. |
| no-failures | This prevents the run failures from being separately printed. |
| no-results  | This turns off the request-wise output as they happen. |

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

## API Reference

### newman.run(options: _object_ , callback: _function_)
The `run` function executes a collection and returns the run result to a callback function provided as parameter.

| Parameter | Description   |
|-----------|---------------|
| options                   | This is a required argument and it contains all information pertaining to running a collection.<br /><br />_Required_<br />Type: `object` |
| options.collection        | The collection is a required property of the `options` argument. It accepts an object representation of a Postman Collection which should resemble the schema mentioned at [https://schema.getpostman.com/](https://schema.getpostman.com/). The value of this property could also be an istance of Collection Object from the [Postman Collection SDK](https://github.com/postmanlabs/postman-collection).<br /><br />As `string`, one can provide a URL where the Collection JSON can be found (e.g. [Postman Cloud API](https://api.getpostman.com/) service) or path to a local JSON file.<br /><br />_Required_<br />Type: `object|string|`[PostmanCollection](https://github.com/postmanlabs/postman-collection/wiki#Collection) |
| options.environmet        | One can optionally pass an environment file path or URL as `string` to this property and that will be used to read Postman Environment Variables from. This property also accepts environment variables as an `object`. Environment files exported from Postman App can be directly used here.<br /><br />_Optional_<br />Type: `object|string` |
| options.globals           | Postman Global Variables can be optionally passed on to a collection run in form of path to a file or URL. It also accepts variables as an `object`.<br /><br />_Optional_<br />Type: `object|string` |
| options.iterationCount    | Specify the number of iterations to run on the collection. This is usually accompanied by providing a data file reference as `options.iterationData`.<br /><br />_Optional_<br />Type: `number` |
| options.iterationData     | Path to the JSON or CSV file to be used as data source when running multiple iterations on a collection.<br /><br />_Optional_<br />Type: `string` |
| options.folder            | The name or ID of the folder (ItemGroup) in the collection which would be run instead of the entire collection.<br /><br />_Optional_<br />Type: `string` |
| options.timeoutRequest    | Specify the time (in milliseconds) to wait for requests to return a response.<br /><br />_Optional_<br />Type: `number` |
| options.ignoreRedirects   | This specifies whether newman would automatically follow 3xx responses from servers.<br /><br />_Optional_<br />Type: `boolean` |
| options.insecure          | Disables SSL verification checks and allows self-signed SSL certificates.<br /><br />_Optional_<br />Type: `boolean` |
| options.reporters         | Specify one reporter name as `string` or provide more than one reporter name as an `array`.<br /><br />Available reporters: `cli`, `html` and `junit`.<br /><br />_Optional_<br />Type: `string|array` |
| options.noColor           | Newman attempts to automatically turn off color output to terminals when it detects the lack of color support. With this property, one can forcibly turn off the usage of color in terminal output for reporters and other parts of Newman that output to console.<br /><br />_Optional_<br />Type: `boolean` |
| callback                  | Upon completion of the run, this callback is executed with the `error` argument.<br /><br />_Required_<br />Type: `function` |

## Community Support

<img src="https://www.getpostman.com/img/v2/icons/slack.svg" align="right" />
If you are interested in talking to the team and other Newman users, we are there on <a href="https://www.getpostman.com/slack-invite" target="_blank">Slack</a>. Feel free to drop by and say hello. Our upcoming features and beta releases are discussed here along with world peace.

Get your invitation for Postman Slack Community from: <a href="https://www.getpostman.com/slack-invite">https://www.getpostman.com/slack-invite</a>.<br />
Already member? Sign in at <a href="https://postmancommunity.slack.com">https://postmancommunity.slack.com</a>

## License
This software is licensed under Apache-2.0. Copyright Postdot Technologies, Inc. See the [LICENSE.md](LICENSE.md) file for more information.

[![Analytics](https://ga-beacon.appspot.com/UA-43979731-9/newman/readme)](https://www.getpostman.com)
