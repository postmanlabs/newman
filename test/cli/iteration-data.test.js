var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),

    ITERATION_PROPERTY = 'run.stats.iterations.total',
    FORM_DATA_PROPERTY = 'request.body.formdata[0].value',

    collectionRunPath = path.join(__dirname, '..', '..', 'out', 'iteration-data-test.json');

describe('iterationData modifications', function () {
    afterEach(function () {
        try { fs.unlinkSync(collectionRunPath); }
        catch (e) { console.error(e); }
    });

    it('should iterate according to iterationData.length when no modifier is specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/iteration-data-modifier/iteration-data-modifier.postman_collection.json -d test/integration/iteration-data-modifier/iteration-data-modifier.postman_data.json -r json --reporter-json-export out/iteration-data-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 4 iterations').to.equal(4);
            done();
        });
    });

    it('should start iteration from iterationDataFrom if specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/iteration-data-modifier/iteration-data-modifier.postman_collection.json -d test/integration/iteration-data-modifier/iteration-data-modifier.postman_data.json --iteration-data-from 2 -r json --reporter-json-export out/iteration-data-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 3 iterations').to.equal(3);
            // eslint-disable-next-line lodash/path-style
            expect(_.get(collectionRun, `run.executions[0].${FORM_DATA_PROPERTY}`), 'should start from 2nd data point')
                .to.equal('sampleFirstName2');
            done();
        });
    });

    it('should end iteration at iterationDataTo if specified', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/iteration-data-modifier/iteration-data-modifier.postman_collection.json -d test/integration/iteration-data-modifier/iteration-data-modifier.postman_data.json --iteration-data-to 2 -r json --reporter-json-export out/iteration-data-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 2 iterations').to.equal(2);
            // eslint-disable-next-line lodash/path-style
            expect(_.get(collectionRun, `run.executions[1].${FORM_DATA_PROPERTY}`), 'should end at 2nd data point')
                .to.equal('sampleFirstName2');
            done();
        });
    });

    it('should perform iterations only on data between iterationDataFrom and iterationDataTo ', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/integration/iteration-data-modifier/iteration-data-modifier.postman_collection.json -d test/integration/iteration-data-modifier/iteration-data-modifier.postman_data.json --iteration-data-from 1 --iteration-data-to 3 -r json --reporter-json-export out/iteration-data-test.json', function (code) {
            var collectionRun;

            try { collectionRun = JSON.parse(fs.readFileSync(collectionRunPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(_.get(collectionRun, ITERATION_PROPERTY), 'should have 3 iterations').to.equal(3);
            // eslint-disable-next-line lodash/path-style
            expect(_.get(collectionRun, `run.executions[0].${FORM_DATA_PROPERTY}`), 'should start from 1st data point')
                .to.equal('sampleFirstName1');
            // eslint-disable-next-line lodash/path-style
            expect(_.get(collectionRun, `run.executions[2].${FORM_DATA_PROPERTY}`), 'should end at 3rd data point')
                .to.equal('sampleFirstName3');
            done();
        });
    });
});
