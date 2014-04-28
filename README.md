Newman [![Build Status](https://travis-ci.org/a85/Newman.svg?branch=master)](https://travis-ci.org/a85/Newman) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
======

Newman is command-line collection runner for [Postman](http://getpostman.com). It allows you to effortlessly run and test a Postman collection directly from the command-line. It is built with extensibility in mind so that you can easily integrate it with your continuous integration servers and build systems.

Newman aims to maintain feature parity with Postman and allows you run, inspect and test collections just like Postman.

## Getting Started
Newman is build on Node.js so to run Newman make sure you have node installed. Node.js can be downloaded and installed from [here](http://nodejs.org/download/) on Linux, Windows and Mac OSX.

With that done, Newman is just one command away. 
```
$ npm install -g newman
```
This installs Newman from npm globally on your system allowing you to run it from anywhere.

The easiest way to run Newman is to run it with a collection
```
$ newman -u https://www.getpostman.com/collections/cb208e7e64056f5294e5
```
The `-u` flag allows you to pass a postman collection as a URL. Your collection probably uses environment variables. To provide an accompanying set of environment variables, export them from postman and run them with the `-e` flag.
```
$ newman -u https://www.getpostman.com/collections/cb208e7e64056f5294e5 -e devenvironment.json
```

## Options

```
-h, --help                output usage information
-V, --version             output the version number
-c, --collection [file]   Specify a Postman collection as a JSON [file]
-u, --url [url]           Specify a Postman collection as a [url]
-e, --environment [file]  Specify a Postman environment as a JSON [file]
-d, --data [file]         Specify a data file to use either json or csv
-r, --responseHandler     Pick a repsonse handler to run.
-n, --number [number]     Define the number of iterations to run.
-o, --outputFile [file]   Path to file where output should be written. [file]
```

## Docs
	grunt jsdoc

## Tests
	grunt test

## License
Apache. See the LICENSE file for more information
