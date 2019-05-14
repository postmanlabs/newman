let path = require('path'),
    SecureFs = require('../../lib/run/secure-fs'),

    POSIX_WORKING_DIR = '/Postman/files',
    WIN32_WORKING_DIR = 'C:\\Postman\\files';

/**
 * The posix file system supports only / as valid path separators. \\ is treated as valid folder or
 * file name.
 */
describe('Postman Filesystem', function () {
    describe('sanity', function () {
        it('should not crash with empty construction', function () {
            // eslint-disable-next-line no-unused-vars
            const fs = new SecureFs();
        });

        it('should not crash with proper construction', function () {
            // eslint-disable-next-line no-unused-vars
            const fs = new SecureFs(POSIX_WORKING_DIR, false, []);
        });
    });

    describe('posix resolver', function () {
        let fs;

        before(function () {
            process.platform === 'win32' && this.skip();
        });

        describe('with default working dir', function () {
            before(function () {
                fs = new SecureFs(POSIX_WORKING_DIR, false);
            });

            it('should resolve a posix relative path', function (done) {
                fs.resolvePath('directory/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(POSIX_WORKING_DIR + '/directory/file.json');

                    return done();
                });
            });

            it('should resolve an absolute path within working dir', function (done) {
                fs.resolvePath('/Postman/files/directory/outside.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(POSIX_WORKING_DIR + '/directory/outside.json');

                    return done();
                });
            });

            it('should not resolve an absolute path outside working dir', function (done) {
                fs.resolvePath('/Postman/outside/directory/outside.json', (err) => {
                    expect(err).to.be.ok;

                    expect(err.message).to.eql('PPERM: insecure file access outside working directory');

                    return done();
                });
            });

            it('should resolve relative path with space character', function (done) {
                fs.resolvePath('Dir Space/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(POSIX_WORKING_DIR + '/Dir Space/file.json');

                    return done();
                });
            });
        });

        describe('with file whitelist', function () {
            before(function () {
                fs = new SecureFs(POSIX_WORKING_DIR, false, ['/Postman/cache/morepath/file.json']);
            });

            it('should resolve an absolute path outside working dir if cached', function (done) {
                fs.resolvePath('/Postman/cache/morepath/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql('/Postman/cache/morepath/file.json');

                    return done();
                });
            });
        });

        describe('with insecureFileRead', function () {
            before(function () {
                fs = new SecureFs(POSIX_WORKING_DIR, true);
            });

            it('should resolve an absolute path outside working dir if cached', function (done) {
                fs.resolvePath('/Postman/insecure/morepath/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql('/Postman/insecure/morepath/file.json');

                    return done();
                });
            });
        });

        describe('with cross os paths', function () {
            before(function () {
                fs = new SecureFs(POSIX_WORKING_DIR, true);
            });

            it('should resolve a windows relative path', function (done) {
                fs.resolvePath('directory\\file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(POSIX_WORKING_DIR + '/directory\\file.json');

                    return done();
                });
            });

            it('should resolve a windows absolute path', function (done) {
                fs.resolvePath('C:\\Postman\\files\\directory\\file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(POSIX_WORKING_DIR + '/C:\\Postman\\files\\directory\\file.json');

                    return done();
                });
            });
        });
    });

    /**
     * The windows file system supports both / and \\ as valid path separators
     */
    describe('win32 resolver', function () {
        let fs;

        before(function () {
            process.platform !== 'win32' && this.skip();
        });

        describe('with default working dir', function () {
            before(function () {
                fs = new SecureFs(WIN32_WORKING_DIR, false);

                // Override the internal path to use win32 variant
                fs._path = path.win32;
            });

            it('should resolve a windows relative path', function (done) {
                fs.resolvePath('directory\\file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(WIN32_WORKING_DIR + '\\directory\\file.json');

                    return done();
                });
            });

            it('should resolve an absolute path within working dir', function (done) {
                fs.resolvePath('C:\\Postman\\files\\directory\\outside.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(WIN32_WORKING_DIR + '\\directory\\outside.json');

                    return done();
                });
            });

            it('should not resolve an absolute path outside working dir', function (done) {
                fs.resolvePath('C:\\Postman\\outside\\directory\\outside.json', (err) => {
                    expect(err).to.be.ok;

                    expect(err.message).to.eql('PPERM: insecure file access outside working directory');

                    return done();
                });
            });

            it('should resolve relative path with space character', function (done) {
                fs.resolvePath('Dir Space\\file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(WIN32_WORKING_DIR + '\\Dir Space\\file.json');

                    return done();
                });
            });
        });

        describe('with file whitelist', function () {
            const CACHE_FILE = 'C:\\Postman\\cache\\morepath\\file.json';

            before(function () {
                fs = new SecureFs(WIN32_WORKING_DIR, false, [CACHE_FILE]);

                // Override the internal path to use win32 variant
                fs._path = path.win32;
            });

            it('should resolve an absolute path outside working dir if cached', function (done) {
                fs.resolvePath(CACHE_FILE, (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(CACHE_FILE);

                    return done();
                });
            });
        });

        describe('with insecureFileRead', function () {
            const FILE_OUTSIDE = 'C:\\Postman\\insecure\\morepath\\file.json';

            before(function () {
                fs = new SecureFs(WIN32_WORKING_DIR, true);

                // Override the internal path to use win32 variant
                fs._path = path.win32;
            });

            it('should resolve an absolute path outside working dir if cached', function (done) {
                fs.resolvePath(FILE_OUTSIDE, (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(FILE_OUTSIDE);

                    return done();
                });
            });
        });

        describe('with cross os paths', function () {
            before(function () {
                fs = new SecureFs(WIN32_WORKING_DIR, true);

                // Override the internal path to use win32 variant
                fs._path = path.win32;
            });

            it('should resolve a posix relative path', function (done) {
                fs.resolvePath('directory/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(WIN32_WORKING_DIR + '\\directory\\file.json');

                    return done();
                });
            });

            it('should resolve a posix absolute path', function (done) {
                fs.resolvePath('/Postman/files/directory/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(WIN32_WORKING_DIR + '\\directory\\file.json');

                    return done();
                });
            });

            it('should resolve a posix postman modified LFS absolute path', function (done) {
                fs.resolvePath('/C:/Postman/files/directory/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql(WIN32_WORKING_DIR + '\\directory\\file.json');

                    return done();
                });
            });

            it('should resolve a posix postman modified UNC absolute path', function (done) {
                fs.resolvePath('///Server/Postman/files/directory/file.json', (err, path) => {
                    expect(err).to.not.be.ok;

                    expect(path).to.eql('\\\\Server\\Postman\\files\\directory\\file.json');

                    return done();
                });
            });
        });
    });
});
