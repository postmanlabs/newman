/* eslint-disable max-len */
const expect = require('chai').expect,
    _ = require('lodash'),
    runUtils = require('../../../lib/reporters/postman/helpers/run-utils'),
    {
        NEWMAN_STRING,
        NEWMAN_RUN_STATUS_FINISHED,
        NEWMAN_TEST_STATUS_PASS,
        NEWMAN_TEST_STATUS_FAIL,
        NEWMAN_TEST_STATUS_SKIPPED
    } = require('../../../lib/reporters/postman/helpers/constants'),
    collectionRunOptions = require('../../fixtures/postman-reporter/collection-run-options.json'),
    collectionJson = require('../../fixtures/postman-reporter/newman.postman_collection.json'),
    newman = require('../../../');

describe('Run utils', function () {
    describe('buildCollectionRunObject', function () {
        it('should throw an error if collection run options are missing', function () {
            try {
                runUtils.buildCollectionRunObject(undefined, { a: 1 });
            }
            catch (e) {
                expect(e.message).to.equal('Cannot build Collection run object without collectionRunOptions or runSummary');
            }
        });

        it('should throw an error if run summary is missing', function () {
            try {
                runUtils.buildCollectionRunObject({ a: 1 });
            }
            catch (e) {
                expect(e.message).to.equal('Cannot build Collection run object without collectionRunOptions or runSummary');
            }
        });

        it('should return a collection run object', function (done) {
            newman.run({
                collection: collectionJson
            }, function (err, runSummary) {
                if (err) { return done(err); }

                try {
                    const collectionRunObj = runUtils.buildCollectionRunObject(collectionRunOptions, runSummary),
                        failedTestCount = _.get(runSummary, 'run.stats.assertions.failed', 0),
                        totalTestCount = _.get(runSummary, 'run.stats.assertions.total', 0),
                        skippedTestCount = 1, // _extractSkippedTestCountFromRun(runSummary),
                        passedTestCount = (totalTestCount - (failedTestCount + skippedTestCount)),
                        startedAt = _.get(runSummary, 'run.timings.started'),
                        createdAt = _.get(runSummary, 'run.timings.completed'),
                        totalRequests = _.get(runSummary, 'run.stats.requests.total', 0),
                        totalTime = _.get(runSummary, 'run.timings.responseAverage', 0) * totalRequests,
                        iterations = collectionRunObj.iterations,
                        iteration = iterations[0]; // we only have a single iteration

                    expect(collectionRunObj.id).to.be.a('string');
                    expect(collectionRunObj.collection).to.equal(collectionRunOptions.collection.id);
                    expect(collectionRunObj.environment).to.equal(collectionRunOptions.environment.id);
                    expect(collectionRunObj.folder).to.be.undefined;
                    expect(collectionRunObj.name).to.equal(collectionRunOptions.collection.name);
                    expect(collectionRunObj.status).to.equal(NEWMAN_RUN_STATUS_FINISHED);
                    expect(collectionRunObj.source).to.equal(NEWMAN_STRING);
                    expect(collectionRunObj.delay).to.equal(0);
                    expect(collectionRunObj.currentIteration).to.equal(1);
                    expect(collectionRunObj.failedTestCount).to.equal(failedTestCount);
                    expect(collectionRunObj.passedTestCount).to.equal(passedTestCount);
                    expect(collectionRunObj.skippedTestCount).to.equal(1);
                    expect(collectionRunObj.totalTestCount).to.equal(totalTestCount);
                    expect(collectionRunObj.totalTime).to.equal(totalTime);
                    expect(collectionRunObj.totalRequests).to.equal(totalRequests);
                    expect(collectionRunObj.startedAt).to.equal(startedAt);
                    expect(collectionRunObj.createdAt).to.equal(createdAt);

                    // test the iterations array
                    expect(iterations).to.be.an('array').of.length(1);
                    expect(iterations[0]).to.have.length(2); // there are 2 requests in the test collection

                    _.forEach(iteration, (executionObj) => {
                        expect(executionObj).to.have.property('id').to.be.a('string');
                        expect(executionObj).to.have.property('name').to.be.a('string');
                        expect(executionObj).to.have.property('request').to.be.an('object');
                        expect(executionObj).to.have.property('response').to.be.an('object');
                        expect(executionObj).to.have.property('error').to.be.null;
                        expect(executionObj).to.have.property('tests').to.be.an('array');
                    });


                    // Request 1 Passed
                    expect(iteration[0].tests).to.eql([
                        { name: 'Status code is 200', error: null, status: NEWMAN_TEST_STATUS_PASS },
                        { name: 'Status code is 201', error: null, status: NEWMAN_TEST_STATUS_SKIPPED }
                    ]);

                    // Request 2 Failed
                    expect(iteration[1].tests).to.eql([
                        {
                            name: 'Status code is 404',
                            error: {
                                message: 'expected response to have status code 404 but got 200',
                                name: 'AssertionError',
                                stack: 'AssertionError: expected response to have status code 404 but got 200\n   at Object.eval sandbox-script.js:1:2)'
                            },
                            status: NEWMAN_TEST_STATUS_FAIL
                        }
                    ]);

                    return done();
                }
                catch (err) {
                    return done(err);
                }
            });
        });

        it('should remove null and undefined values from the generated object', function (done) {
            newman.run({
                collection: collectionJson
            }, function (err, runSummary) {
                if (err) { return done(err); }

                let newCollectionRunOptions = _.omit(collectionRunOptions, ['collection.id', 'environment.id']);

                try {
                    const collectionRunObj = runUtils.buildCollectionRunObject(newCollectionRunOptions, runSummary);

                    _.forEach(collectionRunObj, (value) => {
                        expect(value).to.not.be.null;
                        expect(value).to.not.be.undefined;
                    });

                    return done();
                }
                catch (err) {
                    return done(err);
                }
            });
        });
    });
});
