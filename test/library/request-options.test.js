const _ = require('lodash');

describe('Newman request options', function () {
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
            expect(response).to.have.property('url')
                .that.eql('https://postman-echo.com/get');
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
});
