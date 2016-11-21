/**
 * @fileOverview Ensures that editorconfig settings are appropriate
 */

var expect = require('expect.js'),
    editorconfig = require('editorconfig'),

    /**
     * The width (in spaces) of tabs used for indentation throughout the project
     * @type {Number}
     */
    TAB_WIDTH = 4;

/* global describe, it */
describe('.editorconfig', function () {
    var config = editorconfig.parseSync('.editorconfig'); // eslint-disable-line no-sync

    it('should have a tab_width of 4', function () {
        expect(config.tab_width).to.be(TAB_WIDTH);
    });

    it('should have a charset of utf-8', function () {
        expect(config.charset).to.be('utf-8');
    });

    it('should have an indent_size of 4', function () {
        expect(config.indent_size).to.be(TAB_WIDTH);
    });

    it('should have an indent_style of 4', function () {
        expect(config.indent_style).to.be('space');
    });

    it('should have a truthy insert_final_newline value', function () {
        expect(config.insert_final_newline).to.be(true);
    });

    it('should have a truthy trim_trailing_whitespace', function () {
        expect(config.trim_trailing_whitespace).to.be(true);
    });
});
