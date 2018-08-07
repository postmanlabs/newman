var fs = require('fs'),
    path = require('path'),

    sh = require('shelljs');

describe('newman.run exportGlobals', function () {
    var outDir = 'out',
        globals = 'test/fixtures/run/simple-variables.json',
        exportedGlobalsPath = path.join(__dirname, '..', '..', outDir, 'test-globals.json');

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
    });

    it('should export globals to a file', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            globals: globals,
            exportGlobals: exportedGlobalsPath
        }, function (err) {
            if (err) { return done(err); }

            var globals;

            try { globals = JSON.parse(fs.readFileSync(exportedGlobalsPath).toString()); }
            catch (e) { console.error(e); }

            expect(globals).to.be.ok;
            expect(globals).to.have.property('_postman_exported_at');
            expect(globals).to.have.property('values');
            expect(globals.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' },
                { key: 'var-2', value: 'value-2', type: 'any' }
            ]);
            expect(globals).to.have.property('_postman_variable_scope', 'globals');
            done();
        });
    });

    it('should export globals to a file even if collection is failing', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            globals: globals,
            exportGlobals: exportedGlobalsPath
        }, function (err) {
            if (err) { return done(err); }

            var globals;

            try { globals = JSON.parse(fs.readFileSync(exportedGlobalsPath).toString()); }
            catch (e) { console.error(e); }

            expect(globals).to.be.ok;
            expect(globals).to.have.property('_postman_exported_at');
            expect(globals).to.have.property('values');
            expect(globals.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' },
                { key: 'var-2', value: 'value-2', type: 'any' }
            ]);
            expect(globals).to.have.property('_postman_variable_scope', 'globals');
            done();
        });
    });

    it('`newman run` should export globals to a file in a pre-existing directory', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            globals: globals,
            exportGlobals: outDir
        }, function (err) {
            if (err) { return done(err); }

            var dir = fs.readdirSync(outDir),
                file = dir[0],
                globals;

            expect(dir).to.have.length(1);

            try { globals = JSON.parse(fs.readFileSync(outDir + '/' + file).toString()); }
            catch (e) { console.error(e); }

            expect(globals).to.be.ok;
            expect(globals).have.property('_postman_exported_at');
            expect(globals).have.property('values');
            expect(globals.values).eql([
                { key: 'var-1', value: 'value-1', type: 'any' },
                { key: 'var-2', value: 'value-2', type: 'any' }
            ]);
            expect(globals).have.property('_postman_variable_scope', 'globals');
            done();
        });
    });

    it('should export globals with a name if the input file doesn\'t have one', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            globals: {
                values: [{ key: 'var-1', value: 'value-1' }]
            },
            exportGlobals: exportedGlobalsPath
        }, function (err) {
            if (err) { return done(err); }

            var globals;

            try { globals = JSON.parse(fs.readFileSync(exportedGlobalsPath).toString()); }
            catch (e) { console.error(e); }

            expect(globals).to.be.ok;
            expect(globals).to.have.property('_postman_exported_at');
            expect(globals).to.have.property('values');
            expect(globals).to.have.property('name', 'globals');
            expect(globals.values).eql([
                { key: 'var-1', value: 'value-1', type: 'any' }
            ]);
            expect(globals).to.have.property('_postman_variable_scope', 'globals');
            done();
        });
    });

    it('should export globals with a name when no input file is provided', function (done) {
        newman.run({
            collection: {
                item: [{
                    event: [{
                        listen: 'test',
                        script: 'pm.globals.set("var-1", "value-1");'
                    }],
                    request: 'https://postman-echo.com/get?source=newman-sample-github-collection'
                }]
            },
            exportGlobals: exportedGlobalsPath
        }, function (err) {
            if (err) { return done(err); }

            var globals;

            try { globals = JSON.parse(fs.readFileSync(exportedGlobalsPath).toString()); }
            catch (e) { console.error(e); }

            expect(globals).to.be.ok;
            expect(globals).to.have.property('_postman_exported_at');
            expect(globals).to.have.property('values');
            expect(globals).to.have.property('name', 'globals');
            expect(globals.values).to.eql([
                { key: 'var-1', value: 'value-1', type: 'any' }
            ]);
            expect(globals).to.have.property('_postman_variable_scope', 'globals');
            done();
        });
    });
});
