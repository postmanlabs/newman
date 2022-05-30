const expect = require('chai').expect,
    utils = require('../../../lib/reporters/postman/helpers/util'),
    { POSTMAN_API_BASE_URL } = require('../../../lib/reporters/postman/helpers/constants');

describe('Utils', function () {
    describe('parseCLIArguments', function () {
        it('should return empty collection and environment ids for a non array input', function () {
            const result = utils.parseCLIArguments(123);

            expect(result).to.eql({
                collection: '',
                environment: ''
            });
        });

        it('should return empty collection and environment ids for a no match found array', function () {
            const result = utils.parseCLIArguments(['node', 'newman', 'https://google.com', 'e12ewdsx']);

            expect(result).to.eql({
                collection: '',
                environment: ''
            });
        });

        it('should return the extracted collection id', function () {
            const collectionId = 'c178add4-0d98-4333-bd6b-56c3cb0d410f',
                resourceURL = POSTMAN_API_BASE_URL + '/collections/' + collectionId + '?apiKey=123',
                argsArray = ['node', 'newman', 'run', resourceURL],
                result = utils.parseCLIArguments(argsArray);

            expect(result).to.eql({
                collection: collectionId,
                environment: ''
            });
        });

        it('should return the extracted environment id', function () {
            const environmentId = '54b85160-8179-42b8-accf-8bea569e7138',
                resourceURL = POSTMAN_API_BASE_URL + '/environments/' + environmentId + '?apiKey=123',
                argsArray = ['node', 'newman', 'run', resourceURL],
                result = utils.parseCLIArguments(argsArray);

            expect(result).to.eql({
                collection: '',
                environment: environmentId
            });
        });

        it('should return the extracted collection and environment ids', function () {
            const collectionId = 'c178add4-0d98-4333-bd6b-56c3cb0d410f',
                environmentId = '54b85160-8179-42b8-accf-8bea569e7138',
                collectionURL = POSTMAN_API_BASE_URL + '/collections/' + collectionId + '?apiKey=123',
                environmentURL = POSTMAN_API_BASE_URL + '/environments/' + environmentId + '?apiKey=123',
                argsArray = ['node', 'newman', 'run', collectionURL, '--environment', environmentURL],
                result = utils.parseCLIArguments(argsArray);

            expect(result).to.eql({
                collection: collectionId,
                environment: environmentId
            });
        });
    });

    describe('getAPIKeyFromCLIArguments', function () {
        it('should return empty apiKey for a non array input', function () {
            const apiKey = utils.getAPIKeyFromCLIArguments(123);

            expect(apiKey).to.eql('');
        });

        it('should return empty apiKey if no match found in cli args', function () {
            const apiKey = utils.getAPIKeyFromCLIArguments(['node', 'newman', 'https://google.com', 'e12ewdsx']);

            expect(apiKey).to.eql('');
        });

        it('should be able to get apiKey from Postman API of collection', function () {
            const collectionId = '54b85160-8179-42b8-accf-8bea569e7138',
                apiKey = '123',
                resourceURL = POSTMAN_API_BASE_URL + '/collections/' + collectionId + '?apikey=' + apiKey,
                argsArray = ['node', 'newman', 'run', resourceURL],
                result = utils.getAPIKeyFromCLIArguments(argsArray);

            expect(result).to.eql(apiKey);
        });

        it('should be able to get apiKey from Postman API of environment', function () {
            const environmentId = '54b85160-8179-42b8-accf-8bea569e7138',
                apiKey = '123',
                resourceURL = POSTMAN_API_BASE_URL + '/environments/' + environmentId + '?apikey=' + apiKey,
                argsArray = ['node', 'newman', 'run', resourceURL],
                result = utils.getAPIKeyFromCLIArguments(argsArray);

            expect(result).to.eql(apiKey);
        });
    });
});
