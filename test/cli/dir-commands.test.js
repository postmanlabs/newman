describe('CLI dir command options', function () {
    it('should work correctly without any extra options', function (done) {
        exec('node ./bin/newman.js dir-export examples/sample-collection.json', done);
    });
});
