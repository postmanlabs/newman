var fs = require('fs'),

    _ = require('lodash'),
    parseXml = require('xml2js').parseString;

/* global beforeEach, afterEach, describe, it, expect, newman */
describe('JUnit reporter', function () {
    var outFile = 'out/newman-report.xml';

    beforeEach(function (done) {
        fs.stat('out', function (err) {
            if (err) {
                return fs.mkdir('out', done);
            }

            done();
        });
    });

    afterEach(function (done) {
        fs.stat(outFile, function (err) {
            if (err) {
                return done();
            }

            fs.unlink(outFile, done);
        });
    });

    it('should correctly generate the JUnit report for a successful run', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            reporters: ['junit'],
            reporter: { junit: { export: outFile } }
        }, function (err) {
            if (err) { return done(err); }

            fs.readFile(outFile, function (err, data) {
                expect(err).to.not.be.ok();

                parseXml(data, function (error, result) {
                    expect(error).to.not.be.ok();

                    var suite = _.get(result.testsuites, 'testsuite.0');
                    expect(suite).to.not.be.empty();
                    expect(suite.$).to.not.be.empty();
                    expect(suite.testcase).to.not.be.empty();

                    expect(suite.$).to.have.property('tests', '1');
                    expect(suite.$).to.have.property('failures', '0');
                    expect(suite.$).to.have.property('errors', '0');

                    done();
                });
            });
        });
    });

    it('should correctly generate the JUnit report for a failed run', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-request-failing.json',
            reporters: ['junit'],
            reporter: { junit: { export: outFile } }
        }, function (err, summary) {
            expect(err).to.be(null);
            expect(summary.run.failures).to.have.length(1);
            fs.readFile(outFile, function (err, data) {
                expect(err).to.not.be.ok();

                parseXml(data, function (error, result) {
                    expect(error).to.not.be.ok();

                    var testcase,
                        suite = _.get(result.testsuites, 'testsuite.0');

                    expect(suite).to.not.be.empty();
                    expect(suite.$).to.not.be.empty();
                    expect(suite.testcase).to.not.be.empty();

                    expect(suite.$).to.have.property('tests', '1');
                    expect(suite.$).to.have.property('failures', '1');
                    expect(suite.$).to.have.property('errors', '0');

                    testcase = suite.testcase[0];
                    expect(testcase).to.not.be.empty();

                    expect(testcase.$).to.have.property('classname', 'JUnitXmlReporter.constructor');
                    expect(testcase.failure).to.not.be.empty();
                    expect(testcase.failure[0]._).to.not.be.empty();
                    expect(testcase.failure[0].$).to.have.property('type', 'AssertionFailure');

                    expect(testcase.failure).to.not.be.empty();
                    done();
                });
            });
        });
    });

    it('should correctly produce the JUnit report for a run with AssertionError/TypeError', function (done) {
        newman.run({
            collection: 'test/fixtures/run/newman-report-test.json',
            reporters: ['junit'],
            reporter: { junit: { export: outFile } }
        }, function (err, summary) {
            expect(err).to.be(null);
            expect(summary.run.failures).to.have.length(2);
            fs.readFile(outFile, function (err, data) {
                expect(err).to.not.be.ok();

                parseXml(data, function (error, result) {
                    expect(error).to.not.be.ok();

                    var testcase,
                        suite = _.get(result.testsuites, 'testsuite.0');

                    expect(suite).to.not.be.empty();
                    expect(suite.$).to.not.be.empty();
                    expect(suite.testcase).to.not.be.empty();

                    expect(suite.$).to.have.property('tests', '2');
                    expect(suite.$).to.have.property('failures', '1');
                    expect(suite.$).to.have.property('errors', '1');

                    testcase = suite.testcase[0];
                    expect(testcase).to.not.be.empty();

                    expect(testcase.$).to.have.property('classname', 'JUnitXmlReporter.constructor');
                    expect(testcase.failure).to.not.be.empty();
                    expect(testcase.failure[0]._).to.not.be.empty();
                    expect(testcase.failure[0].$).to.have.property('type', 'AssertionFailure');

                    done();
                });
            });
        });
    });
});
