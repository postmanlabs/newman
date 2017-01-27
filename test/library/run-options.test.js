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
});
