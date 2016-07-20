<a href="https://www.getpostman.com/"><img src="https://raw.githubusercontent.com/postmanlabs/postmanlabs.github.io/develop/global-artefacts/postman-logo%2Btext-320x132.png" /></a><br />
_Supercharge your API workflow<br/>Modern software is built on APIs. Postman helps you develop APIs faster._

# newman <sub>_the cli companion for postman_</sub>

Using Newman one can effortlessly run and test a Postman Collections directly from the command-line. It is built with
extensibility in mind so that you can easily integrate it with your continuous integration servers and build systems.

> *BETA RELEASE NOTES*
>
> To use newan beta, ensure that you install using the beta tag: `npm install newman@next`.
>
> The beta version of `newman v3.x` is currently under development and is not intended for production use. Details
> outlining the limitations and roadmap of newman v3.x is outlined in [BETA.md](BETA.md).


## Getting Started

Newman is built using NodeJS v4+. To run Newman, make sure you have NodeJS version 4 or above installed. The latest
version of NodeJS can be easily installed by following instructions mentioned at
[https://nodejs.org/en/download/package-manager/](https://nodejs.org/en/download/package-manager/).

The easiest way to install Newman is using NPM. If you have NodeJS installed, it is most likely that you have NPM
installed as well.

```terminal
$ npm install newman --global;
```

If you are using Newman for a specific project, you may ignore the `--global` install argument and consequently, newman
will only be available for use within the specific directory where you installed it.

### Running a Postman Collection from file using CLI

The `newman run` command allows you to specify a collection file to be run. You can easily export your Postman
Collection as a json file from the Postman App.

```terminal
$ newman run my-collection-file.json -e http://my-server.com/postman-environment --iteration-count 2;
```

### Using Newman inside your NodeJS projects

The following example runs a collection by reading a JSON collection file stored on disk.

```javascript
// require newman in your script
var newman = require('newman');

// use newman.run and pass `options` object to it and wait for execution
// to complete in `callback` parameter
newman.run({
    collection: require('./examples/sample-collection.json'),
    reporters: 'cli'
}, function (err, summary) {
    console.log('collection run complete!');
});
```

## Commandline Options

### newman run <collection-file.json> [options]
