/**
 * @fileOverview Ensures nsprc is as expected
 */

var expect = require('expect.js'),
    fs = require('fs');

/* global describe, it, before */
describe('nsp', function () {
    var nsprc,
        pkg;

    before(function () {
        nsprc = JSON.parse(fs.readFileSync('./.nsprc').toString());
        pkg = JSON.parse(fs.readFileSync('./package.json').toString());
    });

    it('must be a dev dependency', function () {
        expect(pkg.devDependencies && pkg.devDependencies.nsp).to.be.ok();
    });

    describe('nsprc', function () {
        it('must exist', function () {
            expect(nsprc).to.be.ok();
        });

        it('must not have any exclusion', function () {
            expect(nsprc.exceptions).to.eql([]);
        });

        it('must exclude only a known set of packages', function () {
            expect(nsprc.exclusions).to.eql([]);
        });

        // if you are changing the version here, most probably you are better of removing the exclusion in first place.
        // remove the exclusion and check if nsp passes, else update the version here
        it('on excluded package\'s version change must reconsider removing exclusion', function () {
            // expect(pkg.dependencies).to.have.property('<name>', '<semver>');
        });
    });
});
