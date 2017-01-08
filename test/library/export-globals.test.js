var fs = require('fs'),
    path = require('path');

/* global beforeEach, afterEach, describe, it, expect, newman */
describe('--export-globals', function () {
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

    it('`newman run` should export globals to a file', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            globals: globals,
            exportGlobals: exportedGlobalsPath
        }, function (err) {
            if (err) { return done(err); }

            var globals;

            try { globals = JSON.parse(fs.readFileSync(exportedGlobalsPath).toString()); }
            catch (e) { console.error(e); }

            expect(globals).be.ok();
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

    it('`newman run` should export globals to a file even if collection is failing', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            globals: globals,
            exportGlobals: exportedGlobalsPath
        }, function (err) {
            if (err) { return done(err); }

            var globals;

            try { globals = JSON.parse(fs.readFileSync(exportedGlobalsPath).toString()); }
            catch (e) { console.error(e); }

            expect(globals).be.ok();
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
});
