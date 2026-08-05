// The echo fixture's TLS listener presents a certificate signed by a private CA that is in no system trust store, so
// `intercept.js`'s `tls.connect` seam is the only thing letting a mapped https host validate without `insecure`. A
// regression in that seam fails this with a certificate error.

const expect = require('chai').expect,

    newman = require('../../');

describe('TLS trust for a mapped host', function () {
    it('should validate the local fixture CA for a mapped https host without insecure', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json'
        }, function (err, summary) {
            var execution,
                response,
                body;

            if (err) {
                return done(err);
            }

            expect(summary.run.failures, 'the collection test script must have run and passed').to.be.empty;

            execution = summary.run.executions[0];
            response = execution.response;
            body = response.json();

            expect(response.code).to.equal(200);

            // the seam only ever rewrites the port it dials, so the original URL and Host must survive end to end
            expect(execution.request.url.toString())
                .to.equal('https://postman-echo.com/get?source=newman-sample-github-collection');
            expect(body.url).to.equal('https://postman-echo.com/get?source=newman-sample-github-collection');
            expect(body.headers).to.have.property('host', 'postman-echo.com');

            done();
        });
    });
});
