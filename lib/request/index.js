var _ = require('lodash'),
    runtime = require('postman-runtime'),
    sdk = require('postman-collection'),

    colors = require('colors/safe'),
    format = require('util').format,
    util = require('../util'),
    cliUtils = require('../reporters/cli/cli-utils'),
    print = require('../print'),
    Table = require('cli-table3');

// sets theme for colors for console logging
colors.setTheme({
    log: 'grey',
    info: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

module.exports = function (options, callback) {
    var runner = new runtime.Runner(),
        userRequest,
        collection;

    options = _.defaults(options, {
        method: 'get',
        url: undefined,
        timeout: undefined,
        ignoreRedirects: false
    });

    userRequest = {
        method: options.method,
        url: options.url,
        header: options.header
    };

    collection = new sdk.Collection({
        item: {
            request: userRequest
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
    }, {
        done: (err, run) => {
            if (err) { return callback(err); }

            run.start({
                start: function () {
                    print(colors.reset(''));
                },

                beforeRequest: function (err, cur, req) {
                    if (err) { return console.error(err.message); }

                    if (req) {
                        print('%s %s', req.method, req.url.toString(true));
                    }
                    print().wait(colors.gray);
                },

                response: function (err, cur, res) {
                    print('\n');
                    if (err) { return console.error(err.message); }
                    if (!res) { return; }

                    if (res.headers.count()) {
                        print('response headers:\n');
                        res.headers.each((header) => {
                            console.log([header.key, header.value]);
                        });
                    }


                    print('\nresponse body:\n');
                    try {
                        console.dir(res.json());
                    }
                    catch (e) {
                        print(res.text());
                    }
                },

                done: (err) => {
                    print.unwait();
                    print('\n');
                    callback(err);
                }
            });
        }
    });

};
