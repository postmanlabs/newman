const sdk = require('postman-collection'),
    expect = require('chai').expect,

    util = require('../../lib/util');

describe('utility helpers', function () {
    describe('getFullName', function () {
        var collection = new sdk.Collection({
                variables: [],
                info: {
                    name: 'multi-level-folders',
                    _postman_id: 'e5f2e9cf-173b-c60a-7336-ac804a87d762',
                    description: 'A simple V2 collection to test out multi level folder flows',
                    schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
                },
                item: [{
                    name: 'F1',
                    item: [{ name: 'F1.R1' }, { name: 'F1.R2' }, { name: 'F1.R3' }]
                }, {
                    name: 'F2',
                    item: [{
                        name: 'F2.F3',
                        item: [{ name: 'F2.F3.R1' }]
                    },
                    { name: 'F4', item: [] },
                    { name: 'F2.R1' }]
                }, { name: 'R1' }]
            }),
            fullNames = {
                'F1.R1': 'F1 / F1.R1',
                'F1.R2': 'F1 / F1.R2',
                'F1.R3': 'F1 / F1.R3',
                'F2.F3.R1': 'F2 / F2.F3 / F2.F3.R1',
                'F2.R1': 'F2 / F2.R1',
                R1: 'R1',
                F1: 'F1',
                'F2.F3': 'F2 / F2.F3',
                F4: 'F2 / F4',
                F2: 'F2'
            };

        it('should handle empty input correctly', function () {
            expect(util.getFullName(), 'should handle empty input correctly').to.not.be.ok;
            expect(util.getFullName(false), 'should handle `false` input correctly').to.not.be.ok;
            expect(util.getFullName(0), 'should handle `0` input correctly').to.not.be.ok;
            expect(util.getFullName(''), 'should handle `\'\'` input correctly').to.not.be.ok;
            expect(util.getFullName([]), 'should handle `[]` input correctly').to.not.be.ok;
            expect(util.getFullName({}), 'should handle `{}` input correctly').to.not.be.ok;
        });

        it('should handle items correctly', function () {
            collection.forEachItem(function (item) {
                expect(util.getFullName(item)).to.equal(fullNames[item.name]);
            });
        });

        it('should handle item groups correctly', function () {
            collection.forEachItemGroup(function (itemGroup) {
                expect(util.getFullName(itemGroup)).to.equal(fullNames[itemGroup.name]);
            });
        });
    });

    describe('type checkers', function () {
        it('should validate integers', function () {
            expect(util.isInt('123')).to.be.true;
            expect(util.isInt('123.5')).to.be.false;
        });

        it('should validate floating point', function () {
            expect(util.isFloat('123.5')).to.be.true;
        });
    });

    describe('beautifyTime', function () {
        var timings = {
                wait: 1.4010989999997037,
                dns: 0.20460100000036618,
                tcp: 43.05270100000007,
                firstByte: 225.52159900000015,
                download: 7.652700000000095,
                total: 277.628099
            },
            beautifiedTimings = {
                wait: '1ms',
                dns: '204µs',
                tcp: '43ms',
                firstByte: '225ms',
                download: '7ms',
                total: '277ms'
            };

        it('should correctly beautify given timeings object', function () {
            expect(util.beautifyTime(timings)).to.eql(beautifiedTimings);
        });
    });

    describe('extractCollectionId', function () {
        it('should return empty string for a non string input', function () {
            const result = util.extractCollectionId(123);

            expect(result).to.eql('');
        });

        it('should return empty string if no match found', function () {
            const result = util.extractCollectionId('https://www.google.com');

            expect(result).to.eql('');
        });

        it('should return the extracted collection id from valid getpostman link', function () {
            const collectionId = '123-c178add4-0d98-4333-bd6b-56c3cb0d410f',
                postmanApiKey = 'PMAK-1234',
                resourceURL = `https://api.getpostman.com/collections/${collectionId}?apikey=${postmanApiKey}`,
                result = util.extractCollectionId(resourceURL);

            expect(result).to.eql(collectionId);
        });

        it('should return the extracted collection id from valid postman link', function () {
            const collectionId = '123-c178add4-0d98-4333-bd6b-56c3cb0d410f',
                postmanApiKey = 'PMAK-1234',
                resourceURL = `https://api.postman.com/collections/${collectionId}?apikey=${postmanApiKey}`,
                result = util.extractCollectionId(resourceURL);

            expect(result).to.eql(collectionId);
        });
    });

    describe('extractEnvironmentId', function () {
        it('should return empty string for a non string input', function () {
            const result = util.extractEnvironmentId(123);

            expect(result).to.eql('');
        });

        it('should return empty string if no match found', function () {
            const result = util.extractEnvironmentId('https://www.google.com');

            expect(result).to.eql('');
        });

        it('should return the extracted environment id from valid getpostman link', function () {
            const environmentId = '123-c178add4-0d98-4333-bd6b-56c3cb0d410f',
                postmanApiKey = 'PMAK-1234',
                resourceURL = `https://api.getpostman.com/environments/${environmentId}?apikey=${postmanApiKey}`,
                result = util.extractEnvironmentId(resourceURL);

            expect(result).to.eql(environmentId);
        });

        it('should return the extracted environment id from valid postman link', function () {
            const environmentId = '123-c178add4-0d98-4333-bd6b-56c3cb0d410f',
                postmanApiKey = 'PMAK-1234',
                resourceURL = `https://api.postman.com/environments/${environmentId}?apikey=${postmanApiKey}`,
                result = util.extractEnvironmentId(resourceURL);

            expect(result).to.eql(environmentId);
        });
    });

    describe('extractPostmanApiKey', function () {
        it('should return empty string for a non string input', function () {
            const result = util.extractPostmanApiKey(123);

            expect(result).to.eql('');
        });

        it('should return empty string if no match found', function () {
            const result = util.extractPostmanApiKey('https://www.google.com');

            expect(result).to.eql('');
        });

        it('should return the extracted postman api key from valid collection getpostman link', function () {
            const collectionId = '123-c178add4-0d98-4333-bd6b-56c3cb0d410f',
                postmanApiKey = 'PMAK-1234',
                resourceURL = `https://api.getpostman.com/collections/${collectionId}?apikey=${postmanApiKey}`,
                result = util.extractPostmanApiKey(resourceURL);

            expect(result).to.eql(postmanApiKey);
        });

        it('should return the extracted postman api key from valid collection postman link', function () {
            const collectionId = '123-c178add4-0d98-4333-bd6b-56c3cb0d410f',
                postmanApiKey = 'PMAK-1234',
                resourceURL = `https://api.postman.com/collections/${collectionId}?apikey=${postmanApiKey}`,
                result = util.extractPostmanApiKey(resourceURL);

            expect(result).to.eql(postmanApiKey);
        });
    });
});
