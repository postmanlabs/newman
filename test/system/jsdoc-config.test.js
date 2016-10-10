/**
 * @fileOverview This test specs runs tests on the ,jsdoc-config.json file of repository. It has a set of strict tests
 * on the content of the file as well. Any change to .jsdoc-config.json must be accompanied by valid test case in this
 * spec-sheet.
 */
/* global describe, it */
describe('JSDoc configuration', function () {
    var fs = require('fs'),
        _ = require('lodash'),
        expect = require('expect.js'),

        json,
        content,
        jsdocConfigPath = './.jsdoc-config.json';

    it('must exist', function (done) {
        fs.stat(jsdocConfigPath, done);
    });

    it('must have readable content', function () {
        expect(content = fs.readFileSync(jsdocConfigPath).toString()).to.be.ok();
    });

    it('content must be valid JSON', function () {
        expect(json = JSON.parse(content)).to.be.ok();
    });

    describe('tags', function () {
        it('must allow unkown tags', function () {
            expect(json.tags.allowUnknownTags).to.be.ok();
        });

        it('must have jsdoc and closure dictionaries', function () {
            expect(json.tags.dictionaries).to.eql(['jsdoc', 'closure']);
        });
    });

    describe('source', function () {
        it('must have an include pattern', function () {
            expect(json.source.includePattern).to.be('.+\\.js(doc)?$');
        });

        it('must have an exclude pattern', function () {
            expect(json.source.excludePattern).to.be('(^|\\/|\\\\)_');
        });
    });

    describe('plugins', function () {
        it('must have the markdown plugin', function () {
            expect(_.includes(json.plugins, 'plugins/markdown')).to.be.ok();
        });
    });

    describe('templates', function () {
        it('must not have clever links', function () {
            expect(json.templates.cleverLinks).to.not.be.ok();
        });

        it('must not have monospace links', function () {
            expect(json.templates.monospaceLinks).to.not.be.ok();
        });

        it('must highlight tutorial code', function () {
            expect(json.templates.highlightTutorialCode).to.be.ok();
        });
    });

    describe('opts', function () {
        it('must use the Postman JSDoc theme', function () {
            expect(json.opts.template).to.be('./node_modules/postman-jsdoc-theme');
        });

        it('must use UTF-8 encoding', function () {
            expect(json.opts.encoding).to.be('utf8');
        });

        it('must create documentation in out/docs', function () {
            expect(json.opts.destination).to.be('./out/docs');
        });

        it('must recurse', function () {
            expect(json.opts.recurse).to.be.ok();
        });

        it('must have a valid readme', function () {
            expect(json.opts.readme).to.be('README.md');
        });
    });

    describe('markdown', function () {
        it('must have a gfm parser', function () {
            expect(json.markdown.parser).to.be('gfm');
        });

        it('must have jsdoc and closure dictionaries', function () {
            expect(json.markdown.hardwrap).to.not.be.ok();
        });
    });
});
