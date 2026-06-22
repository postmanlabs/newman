const dirUtils = require('../../lib/commands/dir-utils'),
    path = require('path'),
    expect = require('chai').expect,
    fs = require('fs');

describe('dir-utils tests', function () {
    it('should create a temp dir', function (done) {
        const dir = dirUtils.createTempDir();

        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should assert directory absence', function (done) {
        const dir = dirUtils.createTempDir();

        dirUtils.assertDirectoryAbsence(path.join(dir, 'barbaz'));
        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should assert directory existence', function (done) {
        const dir = dirUtils.createTempDir();

        dirUtils.assertDirectoryExistence(dir);
        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should assert file create and existence', function (done) {
        const dir = dirUtils.createTempDir(),
            file = path.join(dir, 'foo.txt');

        dirUtils.createFile(file, '');
        dirUtils.assertFileExistence(file);
        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should be able to create directory', function (done) {
        const dir = dirUtils.createTempDir(),
            newDir = path.join(dir, 'foo');

        dirUtils.createDir(newDir);
        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should assert collection directory', function (done) {
        dirUtils.assertCollectionDir('examples/Sample Postman Collection');
        done();
    });

    it('should sanitize slashes', function (done) {
        const foo = dirUtils.sanitizePathName('/foo/');

        expect(foo).to.equal('_slash_foo_slash_');
        done();
    });

    it('should return same string if no slashes present', function (done) {
        const foo = dirUtils.sanitizePathName('foo');

        expect(foo).to.equal('foo');
        done();
    });

    it('should convert directory tree to collection', function (done) {
        const collectionJSON = dirUtils.dirTreeToCollectionJson('examples/Sample Postman Collection');

        expect(collectionJSON).to.deep.equal(JSON.parse(fs.readFileSync('examples/sample-collection.json')));
        done();
    });

    it('should convert collection to directory tree', function (done) {
        const dir = dirUtils.createTempDir(),
            collectionJSON = JSON.parse(fs.readFileSync('examples/sample-collection.json')),
            currentDir = process.cwd();

        process.chdir(dir);
        dirUtils.traverse(collectionJSON, [], {});
        process.chdir(currentDir);

        let recreatedCollectionJSON = dirUtils.dirTreeToCollectionJson(path.join(dir, 'Sample Postman Collection'));

        expect(recreatedCollectionJSON).to.deep.equal(JSON.parse(fs.readFileSync('examples/sample-collection.json')));

        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should convert collection with -q flag to directory tree and back', function (done) {
        const dir = dirUtils.createTempDir(),
            collectionJSON = JSON.parse(fs.readFileSync('examples/sample-collection.json')),
            currentDir = process.cwd();

        process.chdir(dir);
        dirUtils.traverse(collectionJSON, [], { quoteUnquotedVars: true });
        process.chdir(currentDir);

        let recreatedCollectionJSON = dirUtils.dirTreeToCollectionJson(path.join(dir, 'Sample Postman Collection'));

        expect(recreatedCollectionJSON).to.deep.equal(JSON.parse(fs.readFileSync('examples/sample-collection.json')));

        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should pretty-print JSON body with -p flag on import', function (done) {
        const collectionDir = 'examples/Sample Postman Collection',
            result = dirUtils.dirTreeToCollectionJson(collectionDir, { prettyPrintBody: true }),
            jsonBodyItem = result.item.find((item) => { return item.name === 'A simple POST request with JSON body'; });

        let rawBody = jsonBodyItem.request.body.raw;

        expect(rawBody).to.contain('\n');
        expect(rawBody).to.equal(JSON.stringify(JSON.parse(rawBody), null, 4));
        done();
    });

    it('should quote unquoted array variables with -q flag', function (done) {
        const dir = dirUtils.createTempDir(),
            collectionJSON = JSON.parse(fs.readFileSync('examples/sample-collection.json')),
            currentDir = process.cwd();

        process.chdir(dir);
        dirUtils.traverse(collectionJSON, [], { quoteUnquotedVars: true });
        process.chdir(currentDir);

        let collDir = path.join(dir, 'Sample Postman Collection'),
            recreatedCollectionJSON = dirUtils.dirTreeToCollectionJson(collDir);

        expect(recreatedCollectionJSON).to.deep.equal(JSON.parse(fs.readFileSync('examples/sample-collection.json')));

        fs.rmSync(dir, { recursive: true, force: true });
        done();
    });

    it('should create and remove postman folders under an collection', function (done) {
        dirUtils.createPostmanFolder('examples/Sample Postman Collection/foo');
        dirUtils.removePostmanFolder('examples/Sample Postman Collection/foo');
        done();
    });
});
