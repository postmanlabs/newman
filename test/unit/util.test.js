var sdk = require('postman-collection'),

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
});
