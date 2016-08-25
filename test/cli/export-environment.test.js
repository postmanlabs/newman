/* global describe, it, exec, expect */
var fs = require('fs');

describe('--export-environment', function () {
    this.timeout(1000 * 60); // set 60s timeout

    afterEach(function () {
        try { fs.unlinkSync('out/test-environment.json'); }
        catch (e) { console.error(e); }
    });

    it('`newman run` should export environment to a file', function (done) {
        // eslint-disable-next-line max-len
        exec('./bin/newman.js run test/cli/single-get-request.json -e test/cli/simple-variables.json --export-environment out/test-environment.json', function (code) {
            var environment;

            try { environment = JSON.parse(fs.readFileSync('out/test-environment.json').toString()); }
            catch (e) { console.error(e); }

            expect(code).be(0);
            expect(environment).be.ok();
            expect(environment).have.property('_postman_exported_at');
            expect(environment).have.property('values');
            expect(environment.values).eql([
                { key: 'var-1', name: 'var-1', value: 'value-1', type: 'string' },
                { key: 'var-2', name: 'var-2', value: 'value-2', type: 'string' }
            ]);
            done();
        });
    });

    it('`newman run` should export environment to a file even if collection is failing', function (done) {
        // eslint-disable-next-line max-len
        exec('./bin/newman.js run test/cli/single-request-failing.json -e test/cli/simple-variables.json --export-environment out/test-environment.json', function (code) {
            var environment;

            try { environment = JSON.parse(fs.readFileSync('out/test-environment.json').toString()); }
            catch (e) { console.error(e); }

            expect(code).not.be(0);
            expect(environment).be.ok();
            expect(environment).have.property('_postman_exported_at');
            expect(environment).have.property('values');
            expect(environment.values).eql([
                { key: 'var-1', name: 'var-1', value: 'value-1', type: 'string' },
                { key: 'var-2', name: 'var-2', value: 'value-2', type: 'string' }
            ]);
            done();
        });
    });
});
