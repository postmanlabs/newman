// The three mutual-TLS servers live in `test/fixtures/servers/client-cert.js`, started by the runner on ephemeral
// ports, so this spec only has to hand each run the ports as variables. The collections name them through
// `{{mtlsServerNPort}}`; the `--ssl-client-cert-list` config cannot, since Newman resolves no variables inside it, so
// `resolveCertList()`/`writeCertList()` substitute them.

const path = require('path'),
    expect = require('chai').expect,

    newman = require('../../'),
    servers = require('../fixtures/servers'),
    clientCert = require('../fixtures/servers/client-cert'),

    // owns its own scratch directory, so a parallel worker cannot delete it mid-test
    CERT_LIST_FILE = path.join(__dirname, '..', '..', 'out', 'library-ssl-client-cert', 'cert-list.json');

describe('SSL Client certificates', function () {
    var certListFile;

    before(function () {
        certListFile = clientCert.writeCertList(CERT_LIST_FILE, servers.ports());
    });

    /**
     * Runs a collection with the fixture server ports supplied as environment variables.
     *
     * @param {Object} options - `newman.run` options.
     * @param {Function} done - Mocha's callback.
     * @returns {*}
     */
    function run (options, done) {
        return newman.run({
            ...options,
            envVar: Object.entries(servers.ports()).map(function (entry) {
                return { key: entry[0], value: entry[1] };
            })
        }, done);
    }

    // @todo: add .pfx, .pem tests as well
    it('should work correctly with standalone client certificates', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert.json',
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should work correctly with multiple client certificates', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: certListFile,
            insecure: true
        }, done);
    });

    it('should give precedence to client cert list when both client cert options present', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: certListFile,
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should fallback to individual client cert when multiple client cert don\'t match', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert.json',
            sslClientCertList: certListFile,
            sslClientCert: 'test/fixtures/ssl/client.crt',
            sslClientKey: 'test/fixtures/ssl/client.key',
            sslClientPassphrase: 'password',
            insecure: true
        }, done);
    });

    it('should bail out if client certificate list file does not exist', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'invalid-cert-file.json', // using an invalid cert list
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message)
                .to.equal('unable to read the ssl client certificates file "invalid-cert-file.json"');
            done();
        });
    });

    it('should bail out if unable to parse client certificate list', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: './ssl-client-cert-test.js', // using an invalid cert list
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message)
                .to.equal('unable to read the ssl client certificates file "./ssl-client-cert-test.js"');
            done();
        });
    });

    it('should bail out if client certificate list is not array', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: 'test/fixtures/run/ssl-client-cert.json', // using an invalid cert list
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message).to.equal('expected ssl client certificates list to be an array.');
            done();
        });
    });

    it('should use list if list is an array', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',

            // the resolved list, passed as an array rather than a path - the other half of the option's contract
            sslClientCertList: clientCert.resolveCertList(servers.ports()).slice(0, 1),
            insecure: true
        }, done);
    });

    it('should bail if client certificate list file path is invalid', function (done) {
        run({
            collection: 'test/fixtures/run/ssl-client-cert-list.json',
            sslClientCertList: {},
            insecure: true
        }, function (err) {
            expect(err).to.exist;
            expect(err.message).to.equal('path for ssl client certificates list file must be a string');
            done();
        });
    });
});
