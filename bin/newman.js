#!/usr/bin/env node

var ArgumentParser = require('argparse').ArgumentParser,
    pkg = require('../package.json'),
    parser;

parser = new ArgumentParser({
    prog: pkg.name,
    version: pkg.version,
    addHelp: true,
    description: pkg.description
});

parser.addArgument(['-f', '--foo'], {
    help: 'foo bar'
});
parser.addArgument(['-b', '--bar'], {
    help: 'bar foo'
});

console.dir(parser.parseArgs());
