const _ = require('lodash'),

    isDoubleByte = function (str) {
        for (var i = 0, n = str.length; i < n; i++) {
            if (str.charCodeAt(i) > 255) { return true; }
        }

        return false;
    };

/* eslint-disable */
/**
 * @attribution https://github.com/lodash/lodash/issues/2240#issuecomment-418820848
 */
const flattenKeys = (obj, path = []) =>
    !_.isObject(obj)
        ? { [path.join('.')]: obj }
        : _.reduce(obj, (cum, next, key) => _.merge(cum, flattenKeys(next, [...path, key])), {});
/* eslint-enable */

describe('unicode handling of cli symbol utility module', function () {
    let cliUtilsSymbols = require('../../lib/reporters/cli/cli-utils-symbols.js');

    it('should have three symbol classes', function () {
        expect(cliUtilsSymbols(true)).to.be.an('object');
        expect(cliUtilsSymbols(false)).to.be.an('object');
    });

    it('should have appropriate fallback for unicode', function () {
        let symbol = cliUtilsSymbols(true),
            fallback = cliUtilsSymbols(false),

            flattenedSymbols = flattenKeys(symbol),
            flattenedPlainSymbols = flattenKeys(fallback);

        expect(flattenedSymbols).to.contain.keys(flattenedPlainSymbols);
    });

    it('should not have unicode when not requested', function () {
        let fallbackSymbols = cliUtilsSymbols(true),
            flattenedPlainSymbols = flattenKeys(fallbackSymbols);

        // first compute all double byte checking
        for (const [key, value] of Object.entries(flattenedPlainSymbols)) {
            // @todo make the assertion better so that failure here says what exactly went wrong
            expect(isDoubleByte(value)).to.eql(false, key);
        }
    });
});
