var sinon = require('sinon'),
    http = require('http'),
    https = require('https');

describe('newman.run requestAgents', function () {
    let httpAgent = new http.Agent(),
        httpsAgent = new https.Agent(),
        httpAgentSpy,
        httpsAgentSpy;

    before(function () {
        httpAgentSpy = sinon.spy(httpAgent, 'createConnection');
        httpsAgentSpy = sinon.spy(httpsAgent, 'createConnection');
    });

    after(function () {
        httpAgentSpy.restore();
        httpsAgentSpy.restore();
    });

    it('should accept custom requesting agents', function (done) {
        newman.run({
            collection: {
                name: 'Collection',
                item: [{
                    request: 'http://postman-echo.com/redirect-to?url=https://httpbin.org/get'
                }]
            },
            requestAgents: {
                http: httpAgent,
                https: httpsAgent
            }
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary).to.be.ok;
            expect(summary.run.failures).to.be.empty;

            const httpAgentOpts = httpAgentSpy.getCall(0).args[0],
                httpsAgentOpts = httpsAgentSpy.getCall(0).args[0],
                response = summary.run.executions[0].response;

            sinon.assert.calledOnce(httpAgentSpy);
            sinon.assert.calledOnce(httpsAgentSpy);

            expect(httpsAgentOpts).to.have.property('agent').that.be.an.instanceof(http.Agent);
            expect(httpAgentOpts).to.have.property('host').that.equal('postman-echo.com');

            expect(httpsAgentOpts).to.have.property('agent').that.be.an.instanceof(https.Agent);
            expect(httpsAgentOpts).to.have.property('host').that.equal('httpbin.org');

            expect(response.reason()).to.equal('OK');

            done();
        });
    });
});
