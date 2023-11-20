const fs = require('fs'),
    expect = require('chai').expect;

/*
    statusCodeCheck = function (code) {
        expect(code).to.equal(0);
    }*/

describe('CLI dir command options', function () {
    it('should export a collection file to directory', function (done) {
        exec('node ./bin/newman.js dir-export examples/sample-collection.json', function (code) {
            expect(code).to.equal(0);
            fs.rmSync('./Sample Postman Collection', { recursive: true, force: true });
            done();
        });
    });

    it('should import a directory into a collection file', function (done) {
        exec('node ./bin/newman.js dir-import "examples/Sample Postman Collection" -o dir-import-test-collection.json',
            function (code) {
                expect(code).to.equal(0);
                fs.rmSync('./dir-import-test-collection.json', { force: true });
                done();
            });
    });

    it('should be able to run dir-export-import-check', function (done) {
        exec('node ./bin/newman.js dir-export-import-check examples/sample-collection.json', function (code) {
            expect(code).to.equal(0);
            done();
        });
    });

    it('should be able to run directory based collection', function (done) {
        exec('node ./bin/newman.js dir-run "examples/Sample Postman Collection"', function (code) {
            expect(code).to.equal(0);
            done();
        });
    });

    it('should be able to create new directory based collection', function (done) {
        exec('node ./bin/newman.js dir-collection-create create-collection-test',
            function (code) {
                expect(code).to.equal(0);
                fs.rmSync('./create-collection-test', { recursive: true, force: true });
                done();
            });
    });

    it('should be able to add a new folder and a request under it and remove them', function (done) {
        exec('node ./bin/newman.js dir-add-folder "examples/Sample Postman Collection/foo"');
        exec('node ./bin/newman.js dir-add-request "examples/Sample Postman Collection/foo/test"');
        exec('node ./bin/newman.js dir-remove-request "examples/Sample Postman Collection/foo/test"');
        exec('node ./bin/newman.js dir-remove-folder "examples/Sample Postman Collection/foo"');
        done();
    });
});
