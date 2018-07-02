#!/usr/bin/env node
/* eslint-env node, es6 */
require('shelljs/global');

var async = require('async'),
    colors = require('colors/safe');

module.exports = function (exit) {
    async.series([
        // we build the docs first
        require('./build-docs'),

        /**
         * Publish the documentation built in the previous step of the pipeline.
         *
         * @param {Function} next - The callback function invoked to mark the completion of the publish routine, either
         * way.
         * @returns {*}
         */
        function (next) {
            console.info(colors.yellow.bold('Generating and publishing documentation for postman-collection'));

            try {
                // go to the out directory and create a *new* Git repo
                cd('out/docs');
                exec('git init');

                // inside this git repo we'll pretend to be a new user
                // @todo - is this change perpetual?
                exec('git config user.name "Doc Publisher"');
                exec('git config user.email "autocommit@postmanlabs.com"');

                // The first and only commit to this new Git repo contains all the
                // files present with the commit message "Deploy to GitHub Pages".
                exec('git add .');
                exec('git commit -m "Deploy to GitHub Pages"');
            }
            catch (e) {
                console.error(e.stack || e);

                return next(e ? 1 : 0);
            }

            // Force push from the current repo's master branch to the remote
            // repo's gh-pages branch. (All previous history on the gh-pages branch
            // will be lost, since we are overwriting it.) We silence any output to
            // hide any sensitive credential data that might otherwise be exposed.

            config.silent = true; // this is apparently reset after exec
            exec('git push --force "git@github.com:postmanlabs/newman.git" master:gh-pages', next);
        }
    ], function (code) {
        console.info(code ? colors.red.bold('\ndocumentation publish failed.') :
            colors.green('\ndocumentation published successfully.'));
        exit(code);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
