var _ = require('lodash'),
    sdk = require('postman-collection'),
    cliUtils = require('../../lib/reporters/cli/cli-utils');

describe('cli-utility helpers', function () {
    describe('getScriptDetails', function () {
        var collection = new sdk.Collection({
                variables: [],
                info: {
                    name: 'C1',
                    description: 'A simple V2 collection to test out multi level scripts',
                    schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
                },
                item: [{
                    name: 'F1',
                    item: [{ name: 'F1.R1', event: [{ script: { id: 1 } }, { script: { id: 2 } }] }]
                }, {
                    name: 'F2',
                    item: [{
                        name: 'F2.F3',
                        item: [{ name: 'F2.F3.R2' }, { name: 'F2.F3.R3' }],
                        event: [{ script: { id: 3 } }]
                    }],
                    event: [{ script: { id: 4 } }]
                }],
                event: [{ script: { id: 5 } }] // collection-level script
            }),
            // symbols can be in any encoding. Here, we use plainText.
            symbols = cliUtils.symbols(true),
            itemScripts = [
                { id: 1, item: collection.oneDeep('F1.R1'), location: 'F1 / F1.R1' },
                { id: 2, item: collection.oneDeep('F1.R1'), location: 'F1 / F1.R1' }
            ],
            itemGroupScripts = [
                { id: 3, item: collection.oneDeep('F2.F3.R2'), location: 'F2 / F2.F3' },
                { id: 3, item: collection.oneDeep('F2.F3.R3'), location: 'F2 / F2.F3' },
                { id: 4, item: collection.oneDeep('F2.F3.R2'), location: 'F2' },
                { id: 4, item: collection.oneDeep('F2.F3.R3'), location: 'F2' }
            ],
            collectionScripts = [
                { id: 5, item: collection.oneDeep('F1.R1'), location: 'C1' },
                { id: 5, item: collection.oneDeep('F2.F3.R2'), location: 'C1' },
                { id: 5, item: collection.oneDeep('F2.F3.R3'), location: 'C1' }
            ];

        it('should handle item-level scripts correctly', function () {
            _.forEach(itemScripts, function (o) {
                var scriptDetails = cliUtils.getScriptDetails(o.item, o.id, symbols);

                expect(_.keys(scriptDetails).sort()).to.eql(['location', 'symbol'].sort());
                expect(scriptDetails.location).to.eql(o.location);
                expect(scriptDetails.symbol).to.eql(' ');
            });
        });

        it('should handle itemGroup-level scripts correctly', function () {
            _.forEach(itemGroupScripts, function (o) {
                var scriptDetails = cliUtils.getScriptDetails(o.item, o.id, symbols);

                expect(_.keys(scriptDetails).sort()).to.eql(['location', 'symbol'].sort());
                expect(scriptDetails.location).to.eql(o.location);
                expect(scriptDetails.symbol).to.eql(symbols.folder);
            });
        });

        it('should handle collection-level scripts correctly', function () {
            _.forEach(collectionScripts, function (o) {
                var scriptDetails = cliUtils.getScriptDetails(o.item, o.id, symbols);

                expect(_.keys(scriptDetails).sort()).to.eql(['location', 'symbol'].sort());
                expect(scriptDetails.location).to.eql(o.location);
                expect(scriptDetails.symbol).to.eql(symbols.root);
            });
        });
    });
});
