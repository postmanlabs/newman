describe('Newman request options', function () {
    var getRequestCurl = 'curl -X GET https://postman-echo.com/get',
        invalidUrl = 'curl -X GET https://123.random.z/get';

    it('should work correctly without any extra options', function (done) {
        newman.request({ curl: getRequestCurl }, done);
    });

    it('should not work with empty options', function (done) {
        newman.request({}, function (err) {
            expect(err).to.be.ok;
            expect(err.message).to.eql('expecting a valid curl command to run');
            done();
        });
    });

    it('should execute correct response for correct url', function (done) {
        newman.request({
            curl: getRequestCurl
        }, function (err, summary) {
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
        newman.request({
            curl: invalidUrl
        }, function (err, summary) {
            expect(err).to.not.be.ok;
            expect(summary.run.failures[0].error.message).to.include('getaddrinfo ENOTFOUND 123.random.z');
            done();
        });
    });
});
