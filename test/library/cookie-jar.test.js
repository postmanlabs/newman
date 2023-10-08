const path = require('path'),
    fs = require('fs'),
    sh = require('shelljs'),
    expect = require('chai').expect,
    CookieJar = require('@postman/tough-cookie').CookieJar,

    newman = require('../../lib/commands/run/collection-runner');

describe('newman.run cookieJar', function () {
    var cookieJar = new CookieJar(),
        cookieJarPath = 'test/fixtures/run/spaces/simple-cookie-jar.json',
        collection = 'test/integration/cookie-jar.postman_collection.json';

    it('should correctly persist cookies across requests in a run', function (done) {
        newman.run({
            collection
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures).to.be.empty;

            done();
        });
    });

    it('should persist cookies in custom cookie jar', function (done) {
        newman.run({
            collection,
            cookieJar
        }, function (err) {
            expect(err).to.be.null;

            var cookies = cookieJar.getCookieStringSync('http://postman-echo.com/');

            expect(cookies).to.match(/foo=bar;/);

            done();
        });
    });

    it('should load cookies from cookie jar file', function (done) {
        newman.run({
            collection: collection,
            cookieJar: cookieJarPath
        }, function (err, summary) {
            expect(err).to.be.null;

            expect(summary.run.executions[1].response.json()).to.eql({
                cookies: {
                    foo: 'bar', // new cookie
                    foo2: 'baz' // existing cookie
                }
            });

            done();
        });
    });

    it('should throw on path to invalid json', function (done) {
        newman.run({
            collection: collection,
            cookieJar: collection
        }, function (err) {
            expect(err).to.be.ok;
            expect(err).to.have.property('message',
                'the file at ' + collection + ' does not contain valid JSON data.');
            done();
        });
    });

    it('should throw on passing invalid cookie jar', function (done) {
        newman.run({
            collection: collection,
            cookieJar: {}
        }, function (err) {
            expect(err).to.be.ok;
            expect(err).to.have.property('message',
                'cookieJar must be a path to a JSON file or a CookieJar instance');
            done();
        });
    });

    describe('export cookieJar', function () {
        var outDir = 'out',
            exportedCookieJarPath = path.join(__dirname, '..', '..', outDir, 'test-cookie-jar.json');

        beforeEach(function () {
            sh.test('-d', outDir) && sh.rm('-rf', outDir);
            sh.mkdir('-p', outDir);
        });

        afterEach(function () {
            sh.rm('-rf', outDir);
        });

        it('should export cookie jar to a file', function (done) {
            newman.run({
                collection: collection,
                exportCookieJar: exportedCookieJarPath
            }, function (err) {
                expect(err).to.be.null;

                var exportedCookieJar,
                    cookies;

                try { exportedCookieJar = CookieJar.fromJSON(fs.readFileSync(exportedCookieJarPath).toString()); }
                catch (e) { console.error(e); }

                expect(exportedCookieJar).to.be.ok;

                cookies = exportedCookieJar.getCookieStringSync('http://postman-echo.com/');

                expect(cookies).to.match(/foo=bar;/);

                done();
            });
        });
    });
});
