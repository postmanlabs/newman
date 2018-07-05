var fs = require('fs'),
    path = require('path'),

    sh = require('shelljs');

describe('newman.run exportEnvironment', function () {
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

    it('should export environment to a file', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            environment: environment,
            exportEnvironment: exportedEnvironmentPath
        }, function (err) {
            if (err) { return done(err); }

            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

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
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            environment: environment,
            exportEnvironment: exportedEnvironmentPath
        }, function (err) {
            if (err) { return done(err); }

            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

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

    it('should export environment with a name if the input file doesn\'t have one', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            environment: {
                values: [{ key: 'var-1', value: 'value-1' }]
            },
            exportEnvironment: exportedEnvironmentPath
        }, function (err) {
            if (err) { return done(err); }

            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

            expect(environment).to.be.ok;
            expect(environment).to.have.property('_postman_exported_at');
            expect(environment).to.have.property('values');
            expect(environment).to.have.property('name', 'environment');
            expect(environment.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' }
            ]);
            expect(environment).to.have.property('_postman_variable_scope', 'environment');
            done();
        });
    });

    it('should export environment with a name when no input file is provided', function (done) {
        newman.run({
            collection: {
                item: [{
                    event: [{
                        listen: 'test',
                        script: 'pm.environment.set("var-1", "value-1");'
                    }],
                    request: 'https://postman-echo.com/get?source=newman-sample-github-collection'
                }]
            },
            exportEnvironment: exportedEnvironmentPath
        }, function (err) {
            if (err) { return done(err); }

            var environment;

            try { environment = JSON.parse(fs.readFileSync(exportedEnvironmentPath).toString()); }
            catch (e) { console.error(e); }

            expect(environment).to.be.ok;
            expect(environment).to.have.property('_postman_exported_at');
            expect(environment).to.have.property('values');
            expect(environment).to.have.property('name', 'environment');
            expect(environment.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' }
            ]);
            expect(environment).to.have.property('_postman_variable_scope', 'environment');
            done();
        });
    });
});
