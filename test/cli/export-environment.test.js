var fs = require('fs'),
    path = require('path'),

    sh = require('shelljs'),

    outDir = 'out',
    exportedEnvironmentPath = path.join(__dirname, '..', '..', outDir, 'test-environment.json');

describe('newman run --export-environment', function () {
    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
    });

    it('should export environment to a file', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -e test/fixtures/run/simple-variables.json --export-environment out/test-environment.json', function (code) {
            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(environment).to.be.ok;
            expect(environment).to.have.property('_postman_exported_at');
            expect(environment).to.have.property('values');
            expect(environment.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' },
                { key: 'var-2', value: 'value-2', type: 'any' }
            ]);
            expect(environment).to.have.property('_postman_variable_scope', 'environment');
            done();
        });
    });

    it('should export environment to a file even if collection is failing', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-request-failing.json -e test/fixtures/run/simple-variables.json --export-environment out/test-environment.json', function (code) {
            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should not have exit code of 0').not.to.equal(0);
            expect(environment).to.be.ok;
            expect(environment).to.have.property('_postman_exported_at');
            expect(environment).to.have.property('values');
            expect(environment.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' },
                { key: 'var-2', value: 'value-2', type: 'any' }
            ]);
            expect(environment).to.have.property('_postman_variable_scope', 'environment');
            done();
        });
    });

    it('`newman run` should export environment to a file in a pre-existing directory', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -e test/fixtures/run/simple-variables.json --export-environment out', function (code) {
            var environment,
                dir = fs.readdirSync(outDir),
                file = dir[0];

            expect(dir).to.have.length(1);

            try { environment = JSON.parse(fs.readFileSync(outDir + '/' + file).toString()); }
            catch (e) { console.error(e); }

            expect(code).to.equal(0);
            expect(environment).to.be.ok;
            expect(environment).have.property('_postman_exported_at');
            expect(environment).have.property('values');
            expect(environment.values).eql([
                { key: 'var-1', value: 'value-1', type: 'any' },
                { key: 'var-2', value: 'value-2', type: 'any' }
            ]);
            expect(environment).have.property('_postman_variable_scope', 'environment');
            done();
        });
    });
});
