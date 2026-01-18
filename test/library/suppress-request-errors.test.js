describe('newman.run suppressRequestErrors', function () {
    it('should accept the suppressRequestErrors parameter', function (done) {
        newman.run({
            collection: 'test/fixtures/run/single-get-request.json',
            suppressRequestErrors: '123.random.z,123.random.x'
        }, done);
    });

    it('should fail if suppressRequestErrors parameter is absent on a failing collection', function (done) {
        newman.run({
            collection: 'test/fixtures/run/failed-request.json'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures, 'should have 1 failure').to.have.lengthOf(1);
            done();
        });
    });

    it('should not fail if suppressRequestErrors parameter is present on a failing collection', function (done) {
        newman.run({
            collection: 'test/fixtures/run/failed-request.json',
            suppressRequestErrors: '123.random.z,123.random.x'
        }, function (err, summary) {
            expect(err).to.be.null;
            expect(summary.run.failures, 'should have 0 failure').to.have.lengthOf(0);
            done();
        });
    });
});
