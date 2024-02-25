describe('Proxy Configuration', function () {
    var proxyConfigListPath = 'test/fixtures/files/proxy-config.json',
        collection = 'test/fixtures/run/proxy-config-list.json';

    it('should work correctly with proxy configuration list', function (done) {
        newman.run({
            collection: collection,
            proxyConfigList: proxyConfigListPath
        }, done);
    });

    it('should bail out if proxy configuration list file does not exist', function (done) {
        newman.run({
            collection: collection,
            proxyConfigList: 'invalid-proxy-config-file.json' // using an invalid proxy config list
        }, function (err) {
            expect(err).to.exist;
            expect(err.message)
                .to.equal('unable to read the proxy configuration file "invalid-proxy-config-file.json"');
            done();
        });
    });

    it('should bail out if unable to parse proxy configuration list', function (done) {
        newman.run({
            collection: collection,
            proxyConfigList: './proxy-config-list-test.js' // using an invalid proxy config list
        }, function (err) {
            expect(err).to.exist;
            expect(err.message)
                .to.equal('unable to read the proxy configuration file "./proxy-config-list-test.js"');
            done();
        });
    });

    it('should bail if proxy configuration list file path is invalid', function (done) {
        newman.run({
            collection: collection,
            proxyConfigList: {}
        }, function (err) {
            expect(err).to.exist;
            expect(err.message).to.equal('path for proxy configuration list file must be a string');
            done();
        });
    });
});
