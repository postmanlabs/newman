#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to create man page for this module
// ---------------------------------------------------------------------------------------------------------------------

process.chdir(__dirname);

var fs = require('fs'),
    readmeToManPage = require('readme-to-man-page'),
    path = require('path'),
    readme = fs.readFileSync(path.join(process.cwd(), '../README.md'), 'utf8'),
    pkg = require(path.join(process.cwd(), '../package.json')),
    manPath,
    manPageContent;

manPath = path.resolve(path.join(process.cwd(), '../man/newman.1'));

manPageContent = readmeToManPage(readme, {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    section: '1',
    manual: 'Newman User Manual'
});

fs.writeFileSync(manPath, manPageContent, 'utf-8');
