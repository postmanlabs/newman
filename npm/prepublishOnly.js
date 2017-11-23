#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to create man page for this module
// ---------------------------------------------------------------------------------------------------------------------

require('shelljs/global');

var fs = require('fs'),
    path = require('path'),

    readme = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8'),
    pkg = require(path.join(__dirname, '../package.json')),

    colors = require('colors/safe'),
    readmeToManPage = require('readme-to-man-page'),

    manPath,
    manPageContent;

manPath = path.resolve(path.join(__dirname, '../man'));

module.exports = function (exit) {

    // create the man page content from markdown
    manPageContent = readmeToManPage(readme, {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        section: '1',
        manual: 'Newman User Manual'
    });

    // write the generated content to the specified path
    if (!fs.existsSync(manPath)) {
        mkdir(manPath);
    }
    fs.writeFile(manPath + '/newman.1', manPageContent, function (err) {
        console.info(err ? err : colors.green.bold(`- man page generated at "${manPath}"`));
        exit(err ? 1 : 0);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);


