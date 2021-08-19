const _ = require('lodash'),
    sinon = require('sinon'),
    runtime = require('postman-runtime'),
    util = require('../../lib/request/util');


describe('Newman request options', function () {
    beforeEach(function () {
        sinon.replace(console, 'warn', sinon.fake());
    });

    afterEach(function () {
        sinon.restore();
    });

    const getRequestCurl = 'curl -X GET https://postman-echo.com/get',
        invalidUrl = 'curl -X GET https://123.random.z/get',
        basicOptions = { reporters: ['cli'], singleRequest: true };

    it('should work correctly without basic options', function (done) {
        const options = _.merge({}, basicOptions, { curl: getRequestCurl });

        newman.request(options, done);
    });

    it('should not work with empty options', function (done) {
        newman.request({}, function (err) {
            expect(err).to.be.ok;
            expect(err.message).to.eql('expecting a valid curl command to run');
            done();
        });
    });

    it('should execute correct response for correct url', function (done) {
        const options = _.merge({}, basicOptions, { curl: getRequestCurl });

        newman.request(options, function (err, summary) {
            const executions = summary.run.executions,
                response = executions[0].response.json();

            expect(err).to.not.be.ok;
            expect(response).to.have.property('url').that.eql('https://postman-echo.com/get');
            expect(executions).to.have.lengthOf(1);
            done();
        });
    });

    it('should not execute correct response for incorrect url', function (done) {
        const options = _.merge({}, basicOptions, { curl: invalidUrl });

        newman.request(options, function (err, summary) {
            expect(err).to.not.be.ok;
            expect(summary.run.failures[0].error.message).to.include('getaddrinfo ENOTFOUND 123.random.z');
            done();
        });
    });

    it('should work without any reporters', function (done) {
        const options = _.merge({}, basicOptions, {
            curl: getRequestCurl,
            reporters: []
        });

        newman.request(options, function (err, summary) {
            const executions = summary.run.executions,
                response = executions[0].response.json();

            expect(err).to.not.be.ok;
            expect(response).to.have.property('url').that.eql('https://postman-echo.com/get');
            expect(executions).to.have.lengthOf(1);
            done();
        });
    });

    it('should work with string reporters', function (done) {
        const options = _.merge({}, basicOptions, {
            curl: getRequestCurl,
            reporters: 'cli'
        });

        newman.request(options, function (err, summary) {
            const executions = summary.run.executions,
                response = executions[0].response.json();

            expect(err).to.not.be.ok;
            expect(response).to.have.property('url').that.eql('https://postman-echo.com/get');
            expect(executions).to.have.lengthOf(1);
            done();
        });
    });

    it('should work with non-cli reporters', function (done) {
        const options = _.merge({}, basicOptions, {
            curl: getRequestCurl,
            reporters: ['json', 'progress']
        });

        newman.request(options, function (err, summary) {
            const executions = summary.run.executions,
                response = executions[0].response.json();

            expect(err).to.not.be.ok;
            expect(response).to.have.property('url').that.eql('https://postman-echo.com/get');
            expect(executions).to.have.lengthOf(1);
            done();
        });
    });

    describe('external reporters', function () {
        it('warns when not found for newman request', function (done) {
            const options = _.merge({}, basicOptions, {
                curl: getRequestCurl,
                reporters: ['unknownreporter']
            });

            newman.request(options, function (err) {
                expect(err).to.be.null;
                expect(console.warn.called).to.be.true;
                expect(console.warn.calledWith('newman: could not find "unknownreporter" reporter')).to.be.true;
                expect(console.warn.calledWith('  please install reporter using npm\n')).to.be.true;

                done();
            });
        });

        it('warns with install command when known reporter is not found for newman request', function (done) {
            const options = _.merge({}, basicOptions, {
                curl: getRequestCurl,
                reporters: ['html']
            });

            newman.request(options, function (err) {
                expect(err).to.be.null;
                expect(console.warn.called).to.be.true;
                expect(console.warn.calledWith('newman: could not find "html" reporter')).to.be.true;
                expect(console.warn.calledWith('  run `npm install newman-reporter-html`\n')).to.be.true;

                done();
            });
        });

        it('warns when scoped reporter is not found for newman request', function (done) {
            const options = _.merge({}, basicOptions, {
                curl: getRequestCurl,
                reporters: ['@company/reporter']
            });

            newman.request(options, function (err) {
                expect(err).to.be.null;
                expect(console.warn.called).to.be.true;
                expect(console.warn.calledWith('newman: could not find "@company/reporter" reporter')).to.be.true;
                expect(console.warn.calledWith('  please install reporter using npm\n')).to.be.true;

                done();
            });
        });
    });

    it('should throw an error for unexpected error from curl2postman module', function (done) {
        sinon.stub(util, 'convertCurltoCollection').yields(new Error('fake-crash_curl2postman'));
        expect(function () {
            newman.request({ curl: 'curl -X GET "https://postman-echo.com/get"' }, function (err) {
                expect(err.message).to.equal('fake-crash_curl2postman');
                sinon.restore();
                done();
            });
        }).to.not.throw();
    });

    it('should throw an error for unexpected error from postman-runtime module', function (done) {
        sinon.stub(runtime, 'Runner').prototype.run = (collection, options, callback) => {
            callback(new Error('fake-crash_postman-runtime'));
        };
        expect(function () {
            newman.request({ curl: 'curl -X GET "https://postman-echo.com/get"' }, function (err) {
                expect(err.message).to.equal('fake-crash_postman-runtime');
                sinon.restore();
                done();
            });
        }).to.not.throw();
    });

    it('should show warning that more than one dominant reporter can not exist', function (done) {
        const PostmanJSONReporter = require('../../lib/reporters/json');

        PostmanJSONReporter.prototype.dominant = true;

        expect(function () {
            newman.request({
                curl: 'curl -X GET "https://postman-echo.com/get"',
                reporters: ['cli', 'json'],
                singleRequest: true
            }, function (err) {
                expect(err).to.be.null;
                expect(console.warn.called).to.be.true;
                expect(console.warn.calledWith('newman: cli, json reporters might not work well together.')).to.be.true;
                sinon.restore();
                done();
            });
        }).to.not.throw();
    });
});
