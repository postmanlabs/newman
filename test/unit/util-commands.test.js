var util = require('../../lib/request/util');

describe('createCurl', function () {
    var mockInput1 = {
            header: [],
            form: [],
            head: true,
            url: 'https://postman-echo.com/post'
        },
        mockInput2 = {
            header: ['Content-Type: text/plain'],
            form: [],
            request: 'POST',
            url: 'https://postman-echo.com/post'
        },
        mockInput3 = {
            header: [],
            form: ['username=davidwalsh', 'password=something'],
            request: 'POST',
            url: 'https://postman-echo.com/post'
        },
        mockInput4 = {
            header: [],
            form: [],
            get: true,
            url: 'https://google.com'
        },
        mockInput5 = {
            header: ['Content-Type: text/json', 'Scheme: https'],
            form: [],
            data: ['{hello:world}', 'a:b'],
            request: 'POST',
            url: 'https://postman-echo.com/post'
        };

    it('should correctly create a stringified curl command for curl option --head', function () {
        expect(util.createCurl(mockInput1)).to.eql('curl --head https://postman-echo.com/post');
    });

    it('should correctly create a stringified curl command for curl options --request and --header', function () {
        // eslint-disable-next-line max-len, quotes
        expect(util.createCurl(mockInput2)).to.eql("curl --header 'Content-Type: text/plain' --request 'POST' https://postman-echo.com/post");
    });

    it('should correctly create a stringified curl command for curl options --request and --form', function () {
        // eslint-disable-next-line max-len, quotes
        expect(util.createCurl(mockInput3)).to.eql("curl --form 'username=davidwalsh' --form 'password=something' --request 'POST' https://postman-echo.com/post");
    });

    it('should correctly create a stringified curl command for curl options --get', function () {
        // eslint-disable-next-line max-len
        expect(util.createCurl(mockInput4)).to.eql('curl --get https://google.com');
    });

    // eslint-disable-next-line max-len
    it('should correctly create a stringified curl command for curl options --request, --header, --data', function () {
        // eslint-disable-next-line max-len, quotes
        expect(util.createCurl(mockInput5)).to.eql("curl --header 'Content-Type: text/json' --header 'Scheme: https' --data '{hello:world}' --data 'a:b' --request 'POST' https://postman-echo.com/post");
    });
});
