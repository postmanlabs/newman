var fs = require('fs'),
    path = require('path'),

    sh = require('shelljs');

/* global beforeEach, afterEach, describe, it, expect, newman */
describe('--export-environment', function () {
    var outDir = 'out',
        environment = 'test/fixtures/run/simple-variables.json',
        exportedEnvironmentPath = path.join(__dirname, '..', '..', outDir, 'test-environment.json');

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
    });

    it('`newman run` should export environment to a file', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            environment: environment,
            exportEnvironment: exportedEnvironmentPath
        }, function (err) {
            if (err) { return done(err); }

            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

            expect(environment).be.ok();
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

    it('`newman run` should export environment to a file even if collection is failing', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            environment: environment,
            exportEnvironment: exportedEnvironmentPath
        }, function (err) {
            if (err) { return done(err); }

            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

            expect(environment).be.ok();
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

    it('`newman run` should export environment to a file in a pre-existing directory', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            environment: environment,
            exportEnvironment: outDir
        }, function (err) {
            if (err) { return done(err); }

            var dir = fs.readdirSync(outDir),
                file = dir[0],
                environment;

            expect(dir).to.have.length(1);

            try { environment = JSON.parse(fs.readFileSync(outDir + '/' + file).toString()); }
            catch (e) { console.error(e); }

            expect(environment).be.ok();
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
