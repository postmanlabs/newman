var fs = require('fs'),

    _ = require('lodash'),
    parseXml = require('xml2js').parseString;

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

    it('should correctly generate the junit report for a successful run', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code).be(0);
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

    it('should correctly generate the junit report for a failed run', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-request-failing.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code).be(1);
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

    it('should correctly produce the junit report for a run with TypeError', function (done) {
        // eslint-disable-next-line max-len
        exec(`node ./bin/newman.js run test/fixtures/run/newman-report-test.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code).be(1);
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
