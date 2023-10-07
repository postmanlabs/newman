describe('CLI dir command options', function () {
    it('should work correctly without any extra options', function (done) {
        exec('node ./bin/newman.js dir-export examples/sample-collection.json');
        // TODO - move to temp dir
        exec('rm -rf ./Sample Postman Collection', done);
    });

    it('should be able to run dir-export-import-check correctly without any extra options', function (done) {
        exec('node ./bin/newman.js dir-export-import-check examples/sample-collection.json', done);
    });
});
