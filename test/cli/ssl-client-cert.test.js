// The three mutual-TLS servers live in `test/fixtures/servers/client-cert.js`, started by the runner on ephemeral
// ports, so this spec only has to pass each `newman` child the ports as variables. The collections name them through
// `{{mtlsServerNPort}}`; the `--ssl-client-cert-list` config cannot, since Newman resolves no variables inside it, so
// the spec writes a resolved copy into its own scratch directory.

const path = require('path'),
    expect = require('chai').expect,

    servers = require('../fixtures/servers'),
    clientCert = require('../fixtures/servers/client-cert'),

    CERT_LIST_FILE = path.join(__dirname, '..', '..', 'out', 'cli-ssl-client-cert', 'cert-list.json');

describe('SSL Client certificates', function () {
    var certListFile,
        envVars;

    before(function () {
        certListFile = clientCert.writeCertList(CERT_LIST_FILE, servers.ports());
        envVars = Object.entries(servers.ports()).map(function (entry) {
            return `--env-var ${entry[0]}=${entry[1]}`;
        }).join(' ');
    });

    /**
     * Runs a newman child with the fixture server ports supplied as environment variables.
     *
     * @param {String} args - everything after `node ./bin/newman.js run`.
     * @param {Function} assertion - `(code)`
     * @returns {*}
     */
    function run (args, assertion) {
        return exec(`node ./bin/newman.js run ${args} ${envVars}`, assertion);
    }

    // @todo: add .pfx, .pem tests as well
    it('should work correctly with standalone client certificates', function (done) {
        // eslint-disable-next-line max-len
        run('test/fixtures/run/ssl-client-cert.json --ssl-client-cert test/fixtures/ssl/client.crt --ssl-client-key test/fixtures/ssl/client.key --ssl-client-passphrase password -k', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should work correctly with a trusted CA certificate provided', function (done) {
        // eslint-disable-next-line max-len
        run('test/fixtures/run/ssl-client-cert.json --ssl-client-cert test/fixtures/ssl/client.crt --ssl-client-key test/fixtures/ssl/client.key --ssl-client-passphrase password --ssl-extra-ca-certs test/fixtures/ssl/ca.crt', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should work correctly with multiple client certificates', function (done) {
        // eslint-disable-next-line max-len
        run(`test/fixtures/run/ssl-client-cert-list.json --verbose --ssl-client-cert-list ${certListFile} -k`, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should use certificate from list when both client certificates options are used', function (done) {
        var cmd = 'test/fixtures/run/ssl-client-cert-list.json' +
            ` --ssl-client-cert-list ${certListFile}` +
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        run(cmd, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should fallback to individual client cert when no cert from list match', function (done) {
        var cmd = 'test/fixtures/run/ssl-client-cert.json' +
            ` --ssl-client-cert-list ${certListFile}` +
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        run(cmd, function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should bail out if client certificate list file does not exist', function (done) {
        var cmd = 'test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list invalid-cert-file.json' + // using an invalid cert list
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        run(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });

    it('should bail out if unable to parse client certificate list', function (done) {
        var cmd = 'test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list test/cli/ssl-client-cert-test.js' + // using an invalid cert list
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        run(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });

    it('should bail out if client certificate list is not an array', function (done) {
        var cmd = 'test/fixtures/run/ssl-client-cert-list.json' +
            ' --ssl-client-cert-list test/fixtures/run/ssl-client-cert.json' + // using an invalid cert list
            ' --ssl-client-cert test/fixtures/ssl/client.crt' +
            ' --ssl-client-key test/fixtures/ssl/client.key' +
            ' --ssl-client-passphrase password -k';

        run(cmd, function (code) {
            expect(code, 'should not have exit code 0').to.not.equal(0);
            done();
        });
    });
});
