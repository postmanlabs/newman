/**
 * @fileOverview Ensures nsprc is as expected
 */

var fs = require('fs'),
    _ = require('lodash');

/* global describe, it, before, expect */
describe('nsp', function () {
    var nsprc,
        pkg;

    before(function () {
        nsprc = JSON.parse(fs.readFileSync('./.nsprc').toString());
        pkg = JSON.parse(fs.readFileSync('./package.json').toString());
    });

    it('should be a dev dependency', function () {
        expect(pkg.devDependencies && pkg.devDependencies.nsp).to.be.ok;
    });

    describe('nsprc', function () {
        it('should exist', function () {
            expect(nsprc).to.be.ok;
        });

        it('should not have any exclusion', function () {
            expect(nsprc.exceptions).to.eql([]);
        });

        it('should not have exclusions (prevent erroneous exclusions)', function () {
            expect(nsprc.exclusions).to.eql({});
        });

        it('should match dependency version in package.json to .nsprc (time to remove exclusion?)', function () {
            var pkg = _.pick(require('../../package').dependencies, _.keys(nsprc.exclusions));
            expect(pkg).to.eql(nsprc.exclusions);
        });

        // if you are changing the version here, most probably you are better of removing the exclusion in first place.
        // remove the exclusion and check if nsp passes, else update the version here
        it('should reconsider removing exclusion on excluded package\'s version change', function () {
            // expect(pkg.dependencies).to.have.property('<name>', '<semver>');
        });
    });
});
