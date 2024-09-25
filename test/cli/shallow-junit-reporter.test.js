const fs = require('fs'),

    _ = require('lodash'),
    sh = require('shelljs'),
    expect = require('chai').expect,
    parseXml = require('xml2js').parseString;

describe('JUnit reporter', function () {
    var outDir = 'out',
        outFile = outDir + '/newman-report.xml';

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
    });

    it('should correctly generate the junit report for a successful run', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(0);
                fs.readFile(outFile, function (err, data) {
                    expect(err).to.not.be.ok;

                    parseXml(data, function (error, result) {
                        expect(error).to.not.be.ok;

                        var testcase,
                            suite = _.get(result.testsuites, 'testsuite.0');

                        expect(result.testsuites.$).to.not.be.empty;
                        expect(result.testsuites.$.time).to.match(/^\d+\.\d{3}$/);

                        expect(suite).to.not.be.empty;
                        expect(suite.$).to.not.be.empty;
                        expect(suite.$.time).to.match(/^\d+\.\d{3}$/);

                        testcase = suite.testcase[0];
                        expect(testcase).to.not.be.empty;

                        expect(testcase.$).to.have.property('classname', 'ASimpleGetRequest');

                        expect(suite.$).to.have.property('tests', '1');
                        expect(suite.$).to.have.property('failures', '0');
                        expect(suite.$).to.have.property('errors', '0');

                        done();
                    });
                });
            });
    });

    it('should correctly generate the junit report for a failed run', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-request-failing.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 1').to.equal(1);
                fs.readFile(outFile, function (err, data) {
                    expect(err).to.not.be.ok;

                    parseXml(data, function (error, result) {
                        expect(error).to.not.be.ok;

                        var testcase,
                            suite = _.get(result.testsuites, 'testsuite.0');

                        expect(result.testsuites.$).to.not.be.empty;
                        expect(result.testsuites.$.time).to.match(/^\d+\.\d{3}$/);

                        expect(suite).to.not.be.empty;
                        expect(suite.$).to.not.be.empty;
                        expect(suite.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(suite.testcase).to.not.be.empty;

                        expect(suite.$).to.have.property('tests', '1');
                        expect(suite.$).to.have.property('failures', '1');
                        expect(suite.$).to.have.property('errors', '0');

                        testcase = suite.testcase[0];
                        expect(testcase).to.not.be.empty;

                        expect(testcase.$).to.have.property('classname', 'StatusCodeTest');
                        expect(testcase.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(testcase.failure).to.not.be.empty;
                        expect(testcase.failure[0]._).to.not.be.empty;
                        expect(testcase.failure[0].$).to.have.property('type', 'AssertionFailure');

                        expect(testcase.failure).to.not.be.empty;

                        done();
                    });
                });
            });
    });

    it('should correctly produce the junit report for a run with TypeError', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec(`node ./bin/newman.js run test/fixtures/run/newman-report-test.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 1').to.equal(1);
                fs.readFile(outFile, function (err, data) {
                    expect(err).to.not.be.ok;

                    parseXml(data, function (error, result) {
                        expect(error).to.not.be.ok;

                        var testcase,
                            suite = _.get(result.testsuites, 'testsuite.0');

                        expect(suite).to.not.be.empty;
                        expect(suite.$).to.not.be.empty;
                        expect(suite.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(suite.testcase).to.not.be.empty;
                        expect(suite['system-err']).to.not.be.empty;

                        expect(suite.$).to.have.property('tests', '2');
                        expect(suite.$).to.have.property('failures', '1');
                        expect(suite.$).to.have.property('errors', '1');

                        testcase = suite.testcase[0];
                        expect(testcase).to.not.be.empty;

                        expect(testcase.$).to.have.property('classname', 'FailedRequest');
                        expect(testcase.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(testcase.failure).to.not.be.empty;
                        expect(testcase.failure[0]._).to.not.be.empty;
                        expect(testcase.failure[0].$).to.have.property('type', 'AssertionFailure');

                        done();
                    });
                });
            });
    });

    it('should correctly produce the JUnit report in a pre-existing directory', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json -r junit --reporter-junit-export out',
            function (code) {
                expect(code).to.equal(0);

                var dir = fs.readdirSync(outDir),
                    file = dir[0];

                expect(dir).to.have.property('length', 1);
                fs.stat(outDir + '/' + file, done);
            });
    });

    it('should correctly handle the `--reporter-junit-export=` argument', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec(`node ./bin/newman.js run test/fixtures/run/single-get-request.json -r junit --reporter-junit-export=${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(0);
                fs.stat(outFile, done);
            });
    });

    it('should correctly generate the junit report for a run with nested requests', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec(`node ./bin/newman.js run test/fixtures/run/nested-requests-report-test.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(0);
                fs.readFile(outFile, function (err, data) {
                    expect(err).to.not.be.ok;

                    parseXml(data, function (error, result) {
                        expect(error).to.not.be.ok;

                        var testcase,
                            suite = _.get(result.testsuites, 'testsuite.0');

                        expect(result.testsuites.$).to.not.be.empty;
                        expect(result.testsuites.$.time).to.match(/^\d+\.\d{3}$/);

                        expect(suite).to.not.be.empty;
                        expect(suite.$).to.not.be.empty;
                        expect(suite.$.time).to.match(/^\d+\.\d{3}$/);

                        testcase = suite.testcase[0];
                        expect(testcase).to.not.be.empty;

                        expect(testcase.$).to.have.property('classname', 'NestedRequestTest');

                        expect(suite.$).to.have.property('tests', '2');
                        expect(suite.$).to.have.property('failures', '0');
                        expect(suite.$).to.have.property('errors', '0');

                        done();
                    });
                });
            });
    });

    it('should correctly generate the junit report for a failed run with nested requests', function (done) {
        // eslint-disable-next-line @stylistic/js/max-len
        exec(`node ./bin/newman.js run test/fixtures/run/nested-requests-fail-report-test.json -r junit --reporter-junit-export ${outFile}`,
            function (code) {
                expect(code, 'should have exit code of 0').to.equal(1);
                fs.readFile(outFile, function (err, data) {
                    expect(err).to.not.be.ok;

                    parseXml(data, function (error, result) {
                        expect(error).to.not.be.ok;

                        var testcase,
                            suite = _.get(result.testsuites, 'testsuite.0');

                        expect(result.testsuites.$).to.not.be.empty;
                        expect(result.testsuites.$.time).to.match(/^\d+\.\d{3}$/);

                        expect(suite).to.not.be.empty;
                        expect(suite.$).to.not.be.empty;
                        expect(suite.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(suite.testcase).to.not.be.empty;

                        expect(suite.$).to.have.property('tests', '2');
                        expect(suite.$).to.have.property('failures', '2');
                        expect(suite.$).to.have.property('errors', '0');

                        testcase = suite.testcase[0];
                        expect(testcase).to.not.be.empty;

                        expect(testcase.$).to.have.property('classname', 'NestedRequestTest');
                        expect(testcase.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(testcase.failure).to.not.be.empty;
                        expect(testcase.failure[0]._).to.not.be.empty;
                        expect(testcase.failure[0].$).to.have.property('type', 'AssertionFailure');

                        expect(testcase.failure).to.not.be.empty;

                        testcase = suite.testcase[1];
                        expect(testcase).to.not.be.empty;

                        expect(testcase.$).to.have.property('classname', 'NestedRequestTest');
                        expect(testcase.$.time).to.match(/^\d+\.\d{3}$/);
                        expect(testcase.failure).to.not.be.empty;
                        expect(testcase.failure[0]._).to.not.be.empty;
                        expect(testcase.failure[0].$).to.have.property('type', 'AssertionFailure');

                        expect(testcase.failure).to.not.be.empty;

                        done();
                    });
                });
            });
    });
});
