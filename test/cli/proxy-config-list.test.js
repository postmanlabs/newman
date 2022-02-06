

describe('Proxy Configuration', function () {
    it('should work correctly with proxy configuration list', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js run test/fixtures/run/proxy-config-list.json --verbose --proxy-config-list ./test/fixtures/files/proxy-config.json ', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should bail out if proxy configuration list file does not exist', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/proxy-config-list.json' +
            ' --proxy-config-list invalid-proxy-config-file.json'; // using an invalid proxy config list


        exec(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });

    it('should bail out if unable to parse proxy configuration list', function (done) {
        var cmd = 'node ./bin/newman.js run test/fixtures/run/proxy-config-list.json' +
            ' --proxy-config-list test/cli/proxy-config-list-test.js'; // using an invalid proxy config list

        exec(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });
});
