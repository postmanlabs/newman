// `npm/test-cli.js` exports the policy through `NEWMAN_TEST_NET` and appends `preload.js` to `NODE_OPTIONS`, so a
// spawned `node ./bin/newman.js` installs the same policy its parent did. This is that hand-off's regression test.
//
// Exit code 0 alone would not prove it: `postman-echo.com` is live, so a child that failed to inherit the policy
// would reach it directly and still pass. `x-forwarded-proto` is the decisive signal - the public service's front
// end injects it, and the local fixture has nothing in front of it.

const fs = require('fs'),
    path = require('path'),

    expect = require('chai').expect,

    intercept = require('../fixtures/servers/intercept'),

    reportPath = path.join(__dirname, '..', '..', 'out', 'cli-network-policy', 'network-policy-test.json');

describe('network policy hand-off to a CLI child', function () {
    // `--live` installs no policy, so there is no hand-off to test and the request legitimately reaches the public
    // service, where `x-forwarded-proto` is legitimately present
    before(function () {
        // owns its output directory rather than sharing `out/`, which a parallel worker could delete mid-test
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });

        if (!intercept.installed()) {
            this.skip();
        }
    });

    afterEach(function () {
        try { fs.unlinkSync(reportPath); }
        catch (e) { console.error(e); }
    });

    // eslint-disable-next-line max-len
    it('should reach the local Echo fixture, not the real service, through the policy inherited via NODE_OPTIONS', function (done) {
        exec('node ./bin/newman.js run test/fixtures/run/single-get-request.json ' +
            '-r json --reporter-json-export out/cli-network-policy/network-policy-test.json', function (code) {
            var summary,
                execution,
                body;

            try { summary = JSON.parse(fs.readFileSync(reportPath).toString()); }
            catch (e) { console.error(e); }

            expect(code, 'should have exit code of 0').to.equal(0);
            expect(summary, 'the json reporter must have written a report').to.be.ok;

            execution = summary.run.executions[0];
            body = JSON.parse(Buffer.from(execution.response.stream.data).toString());

            expect(body.url).to.equal('https://postman-echo.com/get?source=newman-sample-github-collection');
            expect(body.headers).to.have.property('host', 'postman-echo.com');
            expect(body.headers).to.not.have.property('x-forwarded-proto');

            done();
        });
    });
});
