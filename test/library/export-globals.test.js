var fs = require('fs'),
    path = require('path');

describe('newman.run exportGlobals', function () {
    var globals = 'test/fixtures/run/simple-variables.json',
        exportedGlobalsPath = path.join(__dirname, '..', '..', 'out', 'test-globals.json');

    beforeEach(function (done) {
        fs.stat('out', function (err) {
            if (err) { return fs.mkdir('out', done); }

            done();
        });
    });

    afterEach(function (done) {
        fs.stat(exportedGlobalsPath, function (err) {
            if (err) { return done(); }

            fs.unlink(exportedGlobalsPath, done);
        });
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
