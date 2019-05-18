describe('Cookie sanity', function () {
    var collection = 'test/integration/cookie-jar.postman_collection.json';

    it('should correctly persist cookies across requests in a run', function (done) {
        newman.run({
            collection
        }, function (err, summary) {
            expect(err).to.be.null;

            expect(summary.run.executions[0].response.cookies.reference).to.be.empty;
            expect(summary.run.executions[0].request.headers.get('cookie')).to.match(/foo=bar;/);

            expect(summary.run.executions[1].response.cookies.reference).to.be.empty;
            expect(summary.run.executions[1].request.headers.get('cookie')).to.match(/foo=bar;/);

            done();
        });
    });
});
