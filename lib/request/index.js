var _ = require('lodash'),
    runtime = require('postman-runtime'),
    sdk = require('postman-collection');

module.exports = function (options, callback) {
    var runner = new runtime.Runner(),
        collection;

    options = _.defaults(options, {
        method: 'get',
        url: undefined,
        timeout: undefined,
        ignoreRedirects: false
    });

    collection = new sdk.Collection({
        item: {
            request: {
                method: options.method,
                url: options.url
            }
        }
    });

    runner.run(collection, {
        timeout: {
            global: options.timeout
        },

        certificates: options.sslClientCert && new sdk.CertificateList({}, [{
            name: 'client-cert',
            matches: [sdk.UrlMatchPattern.MATCH_ALL_URLS],
            key: { src: options.sslClientKey },
            cert: { src: options.sslClientCert },
            passphrase: options.sslClientPassphrase
        }]),

        requester: {
            followRedirects: _.has(options, 'ignoreRedirects') ? !options.ignoreRedirects : undefined,
            strictSSL: _.has(options, 'insecure') ? !options.insecure : undefined
        }
    }, function (err, run) {
        if (err) { return callback(err); }
        run.start(callback);
    });

};
