describe('Newman request options', function () {
    var getRequestCurl = 'curl -X GET https://postman-echo.com/get';

    it('should work correctly without any extra options', function (done) {
        newman.request({ curl: getRequestCurl }, done);
    });
});
