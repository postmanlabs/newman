/* global describe, it, newman */
describe('Newman run options', function () {
    var collection = 'test/fixtures/run/single-get-request.json';

    it('should work correctly without any extra options', function (done) {
        newman.run({
            collection: collection
        }, done);
    });

    it('should not work without a collection', function (done) {
        newman.run({
            environment: 'test/fixtures/run/simple-variables.json'
        }, function (err) {
            expect(err).to.be.ok();
            expect(err.message).to.eql('newman: expecting a collection to run');
            done();
        });
    });

    it('should not work with empty options', function (done) {
        newman.run({}, function (err) {
            expect(err).to.be.ok();
            expect(err.message).to.eql('newman: expecting a collection to run');
            done();
        });
    });

    it('should fail a collection run with undefined test cases', function (done) {
        newman.run({
            collection: 'test/fixtures/run/undefined-test-checks.json'
        }, function (err, summary) {
            if (err) { return done(err); }

            expect(summary.run.failures).to.have.length(1);
            expect(summary.run.failures[0].error).to.have.property('name', 'AssertionFailure');

            done();
        });
    });

    it('should accept iterationData as an array of objects', function (done) {
        newman.run({
            collection: 'test/integration/steph/steph.postman_collection.json',
            iterationData: require('../integration/steph/steph.postman_data.json')
        }, function (err, summary) {
            expect(err).to.not.be.ok();
            expect(summary.run.failures).to.be.empty();
            done();
        });
    });
});
