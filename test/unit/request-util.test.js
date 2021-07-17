var util = require('../../lib/request/util.js'),
    sinon = require('sinon'),
    curl2postman = require('curl-to-postmanv2'),
    Collection = require('postman-collection').Collection;

describe('request util convertCurltoCollection', function () {
    var result = {
            result: true,
            output: [{ type: 'request',
                data: { method: 'GET',
                    name: 'http://google.com',
                    url: 'http://google.com',
                    header: [],
                    body: {},
                    description: 'Generated from a curl request: \ncurl  --get http://google.com'
                }
            }]
        },
        value = 'curl  --get http://google.com',
        value2 = 'curl --request';

    let mockCollection = new Collection();

    mockCollection.items.add({
        name: result.output[0] && result.output[0].data.name,
        request: result.output[0] && result.output[0].data
    });

    it('should throw an error for unexpected error from curl2postman module', function () {
        sinon.stub(curl2postman, 'convert').yields(new Error('fake_crash'));
        util.convertCurltoCollection(value, function (err, result) { // eslint-disable-line
            expect(err.message).to.equal('fake_crash');
            sinon.restore();
        });
    });

    it('should convert curl command to Postman Collection', function () {
        util.convertCurltoCollection(value, function (err, result) {
            expect(err).to.be.null;
            expect(result.items.name).to.eql(mockCollection.items.name);
            expect(result.items.request).to.eql(mockCollection.items.request);
        });
    });

    it('should throw an error for invalid curl command', function () {
        util.convertCurltoCollection(value2, function (err, result) { // eslint-disable-line
            expect(err).to.equal('Error while parsing cURL: Could not identify the URL. Please use the --url option.');
        });
    });
});
