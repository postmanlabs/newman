const expect = require('chai').expect,
    newman = require('../../');

describe('Newman programmatic usage', function () {
    it('should run without any meaningful parameter and pass error in callback', function (done) {
        newman.run({}, function (err) {
            expect(err).to.be.an('error');
            done();
        });
    });
});
