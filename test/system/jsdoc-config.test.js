/**
 * @fileOverview This test specs runs tests on the ,jsdoc-config.json file of repository. It has a set of strict tests
 * on the content of the file as well. Any change to .jsdoc-config.json must be accompanied by valid test case in this
 * spec-sheet.
 */
describe('JSDoc configuration', function () {
    var fs = require('fs'),
        _ = require('lodash'),

        json,
        content,
        jsdocConfigPath = './.jsdoc-config.json';

    it('should exist', function (done) {
        fs.stat(jsdocConfigPath, done);
    });

    it('should have readable content', function () {
        expect(content = fs.readFileSync(jsdocConfigPath).toString()).to.be.ok;
    });

    it('should have valid JSON', function () {
        expect(json = JSON.parse(content)).to.be.ok;
    });

    describe('tags', function () {
        it('should allow unkown tags', function () {
            expect(json.tags.allowUnknownTags).to.be.ok;
        });

        it('should have jsdoc and closure dictionaries', function () {
            expect(json.tags.dictionaries).to.eql(['jsdoc', 'closure']);
        });
    });

    describe('source', function () {
        it('should have an include pattern', function () {
            expect(json.source.includePattern).to.equal('.+\\.js(doc)?$');
        });

        it('should have an exclude pattern', function () {
            expect(json.source.excludePattern).to.equal('(^|\\/|\\\\)_');
        });
    });

    describe('plugins', function () {
        it('should have the markdown plugin', function () {
            expect(_.includes(json.plugins, 'plugins/markdown')).to.be.ok;
        });
    });

    describe('templates', function () {
        it('should not have clever links', function () {
            expect(json.templates.cleverLinks).to.not.be.ok;
        });

        it('should not have monospace links', function () {
            expect(json.templates.monospaceLinks).to.not.be.ok;
        });

        it('should highlight tutorial code', function () {
            expect(json.templates.highlightTutorialCode).to.be.ok;
        });
    });

    describe('opts', function () {
        it('should use the Postman JSDoc theme', function () {
            expect(json.opts.template).to.equal('./node_modules/postman-jsdoc-theme');
        });

        it('should use UTF-8 encoding', function () {
            expect(json.opts.encoding).to.equal('utf8');
        });

        it('should create documentation in out/docs', function () {
            expect(json.opts.destination).to.equal('./out/docs');
        });

        it('should recurse', function () {
            expect(json.opts.recurse).to.be.ok;
        });

        it('should have a valid readme', function () {
            expect(json.opts.readme).to.equal('README.md');
        });
    });

    describe('markdown', function () {
        it('should have a gfm parser', function () {
            expect(json.markdown.parser).to.equal('gfm');
        });

        it('should have jsdoc and closure dictionaries', function () {
            expect(json.markdown.hardwrap).to.not.be.ok;
        });
    });
});
