const expect = require('chai').expect,

    newman = require('../../');

describe('folder variants', function () {
    var collection = {
            id: 'C1',
            name: 'Collection C1',
            item: [{
                id: 'ID1',
                name: 'R1',
                request: 'https://postman-echo.com/get'
            }, {
                id: 'ID2',
                name: 'R2',
                request: 'https://postman-echo.com/get'
            }, {
                id: 'ID3',
                name: 'R3',
                request: 'https://postman-echo.com/get'
            }]
        },

        // Collection with nested folder structure:
        // 1. Hello
        //   1.1 Hello1
        //     R1
        //   1.2 Hello2
        //     R2
        nestedCollection = {
            id: 'C2',
            name: 'Collection C2',
            item: [{
                id: 'F1',
                name: '1. Hello',
                item: [{
                    id: 'F1.1',
                    name: '1.1 Hello1',
                    item: [{
                        id: 'F1.1.R1',
                        name: 'R1',
                        request: 'https://postman-echo.com/get'
                    }]
                }, {
                    id: 'F1.2',
                    name: '1.2 Hello2',
                    item: [{
                        id: 'F1.2.R2',
                        name: 'R2',
                        request: 'https://postman-echo.com/get'
                    }]
                }]
            }]
        },

        // Collection with parent + intermediate folder + deeply nested subfolder structure:
        // Parent
        //   Intermediate
        //     DeepNested
        //       R1
        parentAndDeepNestedCollection = {
            id: 'C4',
            name: 'Collection C4',
            item: [{
                id: 'C4.Parent',
                name: 'Parent',
                item: [{
                    id: 'C4.Intermediate',
                    name: 'Intermediate',
                    item: [{
                        id: 'C4.DeepNested',
                        name: 'DeepNested',
                        item: [{
                            id: 'C4.DeepNested.R1',
                            name: 'R1',
                            request: 'https://postman-echo.com/get'
                        }]
                    }]
                }]
            }]
        },

        // Collection with three top-level folders each containing one nested sub-folder.
        // Mirrors the user-reported scenario:
        //   App-A-Acc folder > 1.1 Acc folder > R1
        //   App-B-Acc folder > 2.1 Acc folder > R2
        //   App-C-Acc folder > 3.1 Acc folder > R3
        multiParentNestedCollection = {
            id: 'C5',
            name: 'Collection C5',
            item: [{
                id: 'C5.AppA',
                name: 'App-A-Acc folder',
                item: [{
                    id: 'C5.AppA.Sub',
                    name: '1.1 Acc folder',
                    item: [{
                        id: 'C5.AppA.Sub.R1',
                        name: 'R1',
                        request: 'https://postman-echo.com/get'
                    }]
                }]
            }, {
                id: 'C5.AppB',
                name: 'App-B-Acc folder',
                item: [{
                    id: 'C5.AppB.Sub',
                    name: '2.1 Acc folder',
                    item: [{
                        id: 'C5.AppB.Sub.R2',
                        name: 'R2',
                        request: 'https://postman-echo.com/get'
                    }]
                }]
            }, {
                id: 'C5.AppC',
                name: 'App-C-Acc folder',
                item: [{
                    id: 'C5.AppC.Sub',
                    name: '3.1 Acc folder',
                    item: [{
                        id: 'C5.AppC.Sub.R3',
                        name: 'R3',
                        request: 'https://postman-echo.com/get'
                    }]
                }]
            }]
        },

        // Collection with deeply nested folder structure:
        // F1
        //   F2
        //     F3
        //       R1
        deeplyNestedCollection = {
            id: 'C3',
            name: 'Collection C3',
            item: [{
                id: 'DF1',
                name: 'F1',
                item: [{
                    id: 'DF2',
                    name: 'F2',
                    item: [{
                        id: 'DF3',
                        name: 'F3',
                        item: [{
                            id: 'DF3.R1',
                            name: 'R1',
                            request: 'https://postman-echo.com/get'
                        }]
                    }]
                }]
            }]
        };

    it('should run the specified request in case folder name is valid', function (done) {
        newman.run({
            collection: collection,
            folder: 'R1'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
            expect(summary.run.executions, 'should have 1 executions').to.have.lengthOf(1);
            expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1']);
            done();
        });
    });

    it('should skip the collection run in case folder name is invalid', function (done) {
        newman.run({
            collection: collection,
            folder: 'R123'
        }, function (err) {
            expect(err).to.be.ok;
            expect(err.message)
                .to.equal('runtime~extractRunnableItems: Unable to find a folder or request: "R123"');
            done();
        });
    });

    it('should run the specified requests in case multiple folder names are passed', function (done) {
        newman.run({
            collection: collection,
            folder: ['R1', 'R3']
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
            expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
            expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1', 'R3']);
            done();
        });
    });

    it('should skip the collection run in case any of the folder name is invalid', function (done) {
        newman.run({
            collection: collection,
            folder: ['R1', 'R123']
        }, function (err) {
            expect(err).to.be.ok;
            expect(err.message)
                .to.equal('Unable to find a folder or request: "R123"');
            done();
        });
    });

    describe('nested folders', function () {
        it('should run a nested folder when specified by name as a string', function (done) {
            newman.run({
                collection: nestedCollection,
                folder: '1.2 Hello2'
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R2']);
                done();
            });
        });

        it('should run a nested folder when specified by name as a single-item array', function (done) {
            newman.run({
                collection: nestedCollection,
                folder: ['1.2 Hello2']
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R2']);
                done();
            });
        });

        it('should run all requests when parent folder is specified', function (done) {
            newman.run({
                collection: nestedCollection,
                folder: '1. Hello'
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1', 'R2']);
                done();
            });
        });

        it('should run multiple nested folders when specified as an array', function (done) {
            newman.run({
                collection: nestedCollection,
                folder: ['1.1 Hello1', '1.2 Hello2']
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1', 'R2']);
                done();
            });
        });

        it('should run nested folders from different parent folders when specified as an array', function (done) {
            newman.run({
                collection: multiParentNestedCollection,
                folder: ['2.1 Acc folder', '3.1 Acc folder']
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 2 executions').to.have.lengthOf(2);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R2', 'R3']);
                done();
            });
        });

        it('should not run requests twice when a parent and its descendant folder are both specified', function (done) {
            newman.run({
                collection: parentAndDeepNestedCollection,
                folder: ['Parent', 'DeepNested']
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 1 execution (not 2)').to.have.lengthOf(1);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1']);
                done();
            });
        });

        it('should not run requests twice when parent and multiple nested descendants are specified', function (done) {
            newman.run({
                collection: parentAndDeepNestedCollection,
                folder: ['Parent', 'Intermediate', 'DeepNested']
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 1 execution (not 3)').to.have.lengthOf(1);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1']);
                done();
            });
        });

        it('should skip the collection run when a nested folder name is invalid', function (done) {
            newman.run({
                collection: nestedCollection,
                folder: 'InvalidFolder'
            }, function (err) {
                expect(err).to.be.ok;
                expect(err.message)
                    .to.equal('runtime~extractRunnableItems: Unable to find a folder or request: "InvalidFolder"');
                done();
            });
        });

        it('should provide a descriptive error when one folder in an array does not exist', function (done) {
            newman.run({
                collection: nestedCollection,
                folder: ['1.2 Hello2', '1.2. Hello2']
            }, function (err) {
                expect(err).to.be.ok;
                expect(err.message)
                    .to.equal('Unable to find a folder or request: "1.2. Hello2"');
                done();
            });
        });

        it('should run a deeply nested folder when specified by name', function (done) {
            newman.run({
                collection: deeplyNestedCollection,
                folder: 'F3'
            }, function (err, summary) {
                expect(err).to.be.null;
                expect(summary.run.stats.iterations.total, 'should have 1 iteration').to.equal(1);
                expect(summary.run.executions, 'should have 1 execution').to.have.lengthOf(1);
                expect(summary.run.executions.map((e) => { return e.item.name; })).to.eql(['R1']);
                done();
            });
        });
    });
});
