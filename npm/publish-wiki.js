#!/usr/bin/env node
/* eslint-env node, es6 */
require('shelljs/global');
require('colors');

var fs = require('fs'),
    path = require('path'),
    async = require('async'),

    WIKI_URL = 'https://github.com/postmanlabs/newman.wiki.git',
    WIKI_GIT_PATH = path.join(__dirname, '..', '.tmp', 'github-wiki'),
    WIKI_VERSION = exec('git describe --always').stdout;

module.exports = function (exit) {
    async.series([
        // build the reference MD
        require('./build-wiki'),

        /**
         * Clones the existing wiki from WIKI_URL into WIKI_GIT_PATH.
         *
         * @param {Function} next - The callback function invoked ot mark the end of the wiki clone routine.
         * @returns {*}
         */
        function (next) {
            console.info('Publishing wiki...'.yellow.bold);

            // create a location to clone repository
            // @todo - maybe do this outside in an os-level temp folder to avoid recursive .git
            mkdir('-p', WIKI_GIT_PATH);
            rm('-rf', WIKI_GIT_PATH);

            // @todo: Consider navigating to WIKI_GIT_PATH, setting up a new git repo there, point the remote
            // to WIKI_GIT_URL,
            // @todo: and push
            exec(`git clone ${WIKI_URL} ${WIKI_GIT_PATH} --quiet`, next);
        },

        /**
         * Update contents of the repository.
         *
         * @param {Function} next - The callback function invoked to mark the completion of the wiki creation.
         * @returns {*}
         */
        function (next) {
            var source = fs.readFileSync(path.join('out', 'wiki', 'REFERENCE.md')).toString(),
                home,
                sidebar;

            // extract sidebar from source
            sidebar = source.replace(/<a name="Collection"><\/a>[\s\S]+/g, '');

            // remove sidebar data from home
            home = source.substr(sidebar.length);

            // add timestamp to sidebar
            sidebar += '\n\n ' + (new Date()).toUTCString();

            async.each([{
                path: path.join('.tmp', 'github-wiki', '_Sidebar.md'),
                data: sidebar
            }, {
                path: path.join('.tmp', 'github-wiki', 'Home.md'),
                data: home
            }], function (opts, next) {
                fs.writeFile(opts.path, opts.data, next);
            }, next);
        },

        /**
         * Publishes the wiki to the Git remote.
         *
         * @param {Function} next - The callback function invoked to mark the end of the wiki publish routine.
         * @returns {*}
         */
        function (next) {
            // silence terminal output to prevent leaking sensitive information
            config.silent = true;

            pushd(WIKI_GIT_PATH);
            exec('git add --all');
            exec('git commit -m "[auto] ' + WIKI_VERSION + '"');
            exec('git push origin master', function (code) {
                popd();
                next(code);
            });
        }
    ], function (code) {
        console.info(code ? colors.red.bold('\nwiki publish failed.') :
            colors.green(`\nwiki published successfully for "${WIKI_VERSION}".`));
        exit(code);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
