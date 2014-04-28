Newman [![Build Status](https://travis-ci.org/a85/Newman.svg?branch=master)](https://travis-ci.org/a85/Newman) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
======

Newman is command-line collection runner for [Postman](http://getpostman.com). It allows you to effortlessly run and test a Postman collection directly from the command-line. It is built with extensibility in mind so that you can easily integrate it with your continuous integration and build systems.

Newman aims to maintain feature parity with Postman and allows you run, inspect and test collections just like Postman.

# Getting Started
Newman is build on Node.js so to run Newman make sure you have node installed. Node.js can be downloaded and installed from [here](http://nodejs.org/download/) on Linux, Windows and Mac OSX.

With that done Newman is just one command away. 
```
$ npm install -g newman
```
This installs Newman from npm globally on your system allowing you to run it from anywhere.

# Usage
	newman -c PostmanCollection -e environment.json
	newman -u http://getpostman.com/collection/1234 -e environment.json

# Docs
	grunt jsdoc

# Tests
	grunt test
